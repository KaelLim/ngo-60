import { Hono } from "hono";
import { query } from "../db.ts";
import { verifyToken } from "./auth.ts";
import { checkBlocked, learnBadWords } from "../services/blocked-words.ts";

interface BlessingTag {
  id: number;
  message: string;
  is_active: boolean;
}

export const blessingTagRoutes = new Hono();

// ── AI 審查設定 ──
const LLM_BASE_URL = Deno.env.get("LLM_BASE_URL");
const LLM_API_KEY = Deno.env.get("LLM_API_KEY");
const LLM_MODEL = Deno.env.get("LLM_MODEL") ?? "Qwen3.6-35B-A3B";

const MODERATION_SYSTEM_PROMPT = `你是慈濟 60 週年活動網站的祝福語審查員。
以下任一情況判定不通過 (ok:false)：
1. 任何語言的髒話、詛咒、侮辱、仇恨、歧視字眼。
2. 對慈濟或其志工的攻擊、貶損、嘲諷或不實負面言論。
3. 廣告、垃圾訊息、政治宣傳、色情或暴力內容。
溫暖、正向、中性、祝福性質的內容判定通過 (ok:true)。
只輸出 JSON，不要其他文字：{"ok":true} 或 {"ok":false,"reason":"簡短中文原因"}`;

interface Verdict {
  ok: boolean;
  reason?: string;
}

// 呼叫 LLM Gateway 審查祝福語。失敗一律 fail-closed（不通過），避免漏審。
async function moderate(message: string): Promise<Verdict> {
  if (!LLM_BASE_URL || !LLM_API_KEY) {
    return { ok: false, reason: "審查服務未設定" };
  }

  const res = await fetch(`${LLM_BASE_URL}chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LLM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: MODERATION_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { ok: parsed.ok === true, reason: parsed.reason };
  } catch {
    // 模型回傳非預期格式 → fail-closed
    return { ok: false, reason: "審查結果無法解析" };
  }
}

// GET /api/blessing-tags - 取得祝福語標籤 (依 id 由新到舊)
// ?limit=N → 只取最新的 N 筆，舊的自動隱藏；前台用此參數，最新的排在最前面
// 不帶 limit → 回傳全部（後台管理用）
blessingTagRoutes.get("/", async (c) => {
  const limitParam = c.req.query("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : null;

  if (limit && limit > 0) {
    const rows = await query<BlessingTag>(
      "SELECT * FROM blessing_tags WHERE is_active = true ORDER BY id DESC LIMIT $1",
      [limit]
    );
    return c.json(rows);
  }

  const rows = await query<BlessingTag>(
    "SELECT * FROM blessing_tags WHERE is_active = true ORDER BY id DESC"
  );
  return c.json(rows);
});

// POST /api/blessing-tags - 新增祝福語標籤（先經 AI 審查）
blessingTagRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { message } = body;
  if (!message || !String(message).trim()) {
    return c.json({ error: "message is required" }, 400);
  }
  const text = String(message).trim();

  // 後台管理員（帶有效 admin token）直接略過審查
  const payload = await verifyToken(c.req.header("Authorization"));
  const isAdmin = !!payload && payload.role === "admin";

  if (!isAdmin) {
    // ── Stage 1: 敏感詞清單（免 token） ──
    const hit = checkBlocked(text);
    if (hit) {
      console.log(`[審查] "${text}" → Stage1 擋下 (0.00s)`);
      return c.json({ ok: false, reason: "包含不當字詞，請修改後再送出", elapsed: 0 }, 422);
    }

    // ── Stage 2: AI 審查 ──
    const start = Date.now();
    let verdict: Verdict;
    try {
      verdict = await moderate(text);
    } catch (e) {
      const secs = ((Date.now() - start) / 1000).toFixed(2);
      console.error(`[審查] "${text}" → 錯誤 (${secs}s): ${(e as Error).message}`);
      return c.json({ ok: false, reason: "審查服務暫時無法使用，請稍後再試", elapsed: Number(secs) }, 503);
    }
    const secs = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[審查] "${text}" → ${verdict.ok ? "通過" : "未通過"} (${secs}s)` + (verdict.reason ? ` 原因:${verdict.reason}` : ""));

    if (!verdict.ok) {
      // (Task 4 will add auto-learn here)
      return c.json({ ok: false, reason: verdict.reason ?? "未通過審查", elapsed: Number(secs) }, 422);
    }
  }

  const rows = await query<BlessingTag>(
    `INSERT INTO blessing_tags (message) VALUES ($1) RETURNING *`,
    [text],
  );
  return c.json({ ok: true, tag: rows[0], elapsed: 0 }, 201);
});

// PUT /api/blessing-tags/:id - 更新祝福語標籤
blessingTagRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
    return c.json({ error: "message is required" }, 400);
  }

  const rows = await query<BlessingTag>(
    "UPDATE blessing_tags SET message = $1 WHERE id = $2 AND is_active = true RETURNING *",
    [message, id]
  );

  if (rows.length === 0) {
    return c.json({ error: "Blessing tag not found" }, 404);
  }

  return c.json(rows[0]);
});

// DELETE /api/blessing-tags/:id - 刪除祝福語標籤
blessingTagRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<BlessingTag>("SELECT * FROM blessing_tags WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Blessing tag not found" }, 404);
  }

  await query("DELETE FROM blessing_tags WHERE id = $1", [id]);
  return c.json({ message: "Blessing tag deleted", id: parseInt(id) });
});
