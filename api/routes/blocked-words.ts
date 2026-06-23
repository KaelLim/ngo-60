import { Hono } from "hono";
import { query } from "../db.ts";
import { verifyToken } from "./auth.ts";
import { loadBlockedWords } from "../services/blocked-words.ts";

export const blockedWordsRoutes = new Hono();

async function requireAdmin(c: any, next: any) {
  const payload = await verifyToken(c.req.header("Authorization"));
  if (!payload) return c.json({ error: "未授權" }, 401);
  if (payload.role !== "admin") return c.json({ error: "權限不足" }, 403);
  await next();
}
blockedWordsRoutes.use("/*", requireAdmin);

// 待審核清單 (AI 自動加入、尚未審核)
blockedWordsRoutes.get("/review", async (c) => {
  const words = await query(
    "SELECT id, word, lang, source FROM blocked_words WHERE reviewed = false ORDER BY id DESC",
  );
  return c.json({ words, count: words.length });
});

// 確實不當 → 標記已審核
blockedWordsRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  await query("UPDATE blocked_words SET reviewed = true WHERE id = $1", [id]);
  return c.json({ ok: true });
});

// 其實正常 → 移入白名單並從黑名單移除
blockedWordsRoutes.post("/:id/allow", async (c) => {
  const id = c.req.param("id");
  const rows = await query<{ word: string }>("SELECT word FROM blocked_words WHERE id = $1", [id]);
  if (rows.length === 0) return c.json({ error: "not found" }, 404);
  await query("INSERT INTO allowed_words (word) VALUES ($1) ON CONFLICT (word) DO NOTHING", [rows[0].word]);
  await query("DELETE FROM blocked_words WHERE id = $1", [id]);
  await loadBlockedWords();
  return c.json({ ok: true });
});
