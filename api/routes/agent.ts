/**
 * AI 聊天式管理後台 - Agent 路由
 * 使用 Claude Agent SDK
 */

import { Hono } from "jsr:@hono/hono@^4.6.0";
import { upgradeWebSocket } from "jsr:@hono/hono@^4.6.0/deno";
import {
  query as claudeQuery,
  tool,
} from "npm:@anthropic-ai/claude-agent-sdk";
import { query } from "../db.ts";

// 定義資料類型
interface Topic {
  id: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  background_image: string | null;
  sort_order: number;
}

interface Event {
  id: number;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  participation_type: string;
  participation_fee: string | null;
  image_url: string | null;
  topic_id: number | null;
  month: number;
  year: number;
}

interface Blessing {
  id: number;
  author: string;
  message: string;
  full_content: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

interface ImpactSection {
  id: number;
  name: string;
  icon: string;
  stat_value: string | null;
  stat_label: string | null;
  sort_order: number;
}

interface Homepage {
  id: number;
  slogan: string | null;
  title: string | null;
  content: string | null;
  updated_at: string;
}

interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
  mime_type: string | null;
  uploaded_at: string;
  is_active: boolean;
}

// 定義 Claude 可以使用的工具（直接操作資料庫）
const tools = {
  // 查詢主題
  getTopics: tool({
    description: "取得所有主題列表",
    parameters: {},
    execute: async () => {
      const rows = await query<Topic>("SELECT * FROM topics ORDER BY sort_order");
      return rows;
    },
  }),

  // 取得單一主題
  getTopic: tool({
    description: "取得單一主題詳情，包含相關活動",
    parameters: {
      id: { type: "number", description: "主題 ID" },
    },
    execute: async ({ id }: { id: number }) => {
      const topicRows = await query<Topic>("SELECT * FROM topics WHERE id = $1", [id]);
      if (!topicRows[0]) return { error: "主題不存在" };

      const eventRows = await query<Event>(
        "SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start",
        [id]
      );
      return { ...topicRows[0], events: eventRows };
    },
  }),

  // 查詢活動
  getEvents: tool({
    description: "取得活動列表，可依月份、年份或主題篩選",
    parameters: {
      month: { type: "number", description: "月份 (1-12)", optional: true },
      year: { type: "number", description: "年份", optional: true },
      topic_id: { type: "number", description: "主題 ID", optional: true },
    },
    execute: async ({ month, year, topic_id }: { month?: number; year?: number; topic_id?: number }) => {
      if (topic_id) {
        return await query<Event>(
          "SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start",
          [topic_id]
        );
      }
      if (month && year) {
        return await query<Event>(
          "SELECT * FROM events WHERE month = $1 AND year = $2 ORDER BY date_start",
          [month, year]
        );
      }
      if (month) {
        return await query<Event>(
          "SELECT * FROM events WHERE month = $1 ORDER BY date_start",
          [month]
        );
      }
      return await query<Event>("SELECT * FROM events ORDER BY date_start");
    },
  }),

  // 查詢祝福語
  getBlessings: tool({
    description: "取得祝福語列表",
    parameters: {
      featured: { type: "boolean", description: "是否只取精選", optional: true },
    },
    execute: async ({ featured }: { featured?: boolean }) => {
      if (featured) {
        return await query<Blessing>(
          "SELECT * FROM blessings WHERE is_featured = true ORDER BY sort_order"
        );
      }
      return await query<Blessing>("SELECT * FROM blessings ORDER BY sort_order");
    },
  }),

  // 查詢影響力區塊
  getImpact: tool({
    description: "取得影響力區塊資料",
    parameters: {},
    execute: async () => {
      return await query<ImpactSection>("SELECT * FROM impact_sections ORDER BY sort_order");
    },
  }),

  // 取得首頁內容
  getHomepage: tool({
    description: "取得首頁內容（標語、標題、說明）",
    parameters: {},
    execute: async () => {
      const rows = await query<Homepage>("SELECT * FROM homepage ORDER BY id LIMIT 1");
      return rows[0] || { error: "首頁內容不存在" };
    },
  }),

  // 更新首頁內容
  updateHomepage: tool({
    description: "更新首頁內容",
    parameters: {
      slogan: { type: "string", description: "首頁標語", optional: true },
      title: { type: "string", description: "首頁標題", optional: true },
      content: { type: "string", description: "首頁內容說明", optional: true },
    },
    execute: async ({ slogan, title, content }: { slogan?: string; title?: string; content?: string }) => {
      const existing = await query<Homepage>("SELECT id FROM homepage LIMIT 1");

      if (existing.length > 0) {
        const rows = await query<Homepage>(
          `UPDATE homepage
           SET slogan = COALESCE($1, slogan),
               title = COALESCE($2, title),
               content = COALESCE($3, content),
               updated_at = NOW()
           WHERE id = $4
           RETURNING *`,
          [slogan, title, content, existing[0].id]
        );
        return rows[0];
      } else {
        const rows = await query<Homepage>(
          `INSERT INTO homepage (slogan, title, content)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [slogan, title, content]
        );
        return rows[0];
      }
    },
  }),

  // 取得圖片庫
  getGallery: tool({
    description: "取得圖片庫列表",
    parameters: {
      random: { type: "boolean", description: "是否隨機取得", optional: true },
      count: { type: "number", description: "隨機取得的數量", optional: true },
    },
    execute: async ({ random, count }: { random?: boolean; count?: number }) => {
      if (random) {
        return await query<GalleryImage>(
          "SELECT * FROM gallery WHERE is_active = true ORDER BY RANDOM() LIMIT $1",
          [count || 15]
        );
      }
      return await query<GalleryImage>(
        "SELECT * FROM gallery WHERE is_active = true ORDER BY uploaded_at DESC"
      );
    },
  }),

  // 刪除圖片
  deleteGalleryImage: tool({
    description: "刪除圖片庫中的圖片",
    parameters: {
      id: { type: "number", description: "圖片 ID" },
    },
    execute: async ({ id }: { id: number }) => {
      const rows = await query<GalleryImage>(
        "UPDATE gallery SET is_active = false WHERE id = $1 RETURNING *",
        [id]
      );
      if (rows.length === 0) {
        return { error: "圖片不存在" };
      }
      return { message: "圖片已刪除", image: rows[0] };
    },
  }),
};

// 系統提示詞
const SYSTEM_PROMPT = `你是慈濟 60 週年活動網站的 AI 管理助手。

你可以幫助用戶：
1. 查詢和管理主題 (Topics)
2. 查詢和管理活動時程 (Events)
3. 查詢和管理祝福語 (Blessings)
4. 查詢影響力數據 (Impact)
5. 更新首頁內容 (Homepage)
6. 管理圖片庫 (Gallery)

請用繁體中文回覆，並且友善地引導用戶。
當執行操作後，請清楚說明結果。
如果用戶想要新增或修改資料，請先確認詳細內容再執行。`;

// 儲存對話歷史
const sessions = new Map<string, Array<{ role: string; content: string }>>();

export const agentRoutes = new Hono();

// HTTP API endpoint for chat
agentRoutes.post("/chat", async (c) => {
  const { sessionId, message } = await c.req.json();

  // 取得或建立 session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  const history = sessions.get(sessionId)!;

  // 加入用戶訊息
  history.push({ role: "user", content: message });

  try {
    // 使用 Claude Agent SDK 進行查詢
    const response = await claudeQuery({
      system: SYSTEM_PROMPT,
      messages: history,
      tools: Object.values(tools),
    });

    // 加入 AI 回覆
    const assistantMessage = response.content;
    history.push({ role: "assistant", content: assistantMessage });

    return c.json({
      success: true,
      message: assistantMessage,
      sessionId,
    });
  } catch (error) {
    console.error("Claude query error:", error);
    return c.json({
      success: false,
      error: String(error),
    }, 500);
  }
});

// WebSocket endpoint for real-time chat
agentRoutes.get("/ws", upgradeWebSocket((_c) => ({
  onOpen: (_event, ws) => {
    console.log("Agent WebSocket connected");
    ws.send(JSON.stringify({ type: "connected", message: "已連接到 AI 管理助手" }));
  },
  onMessage: async (event, ws) => {
    try {
      const data = JSON.parse(event.data.toString());
      const { sessionId, message } = data;

      // 取得或建立 session
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      const history = sessions.get(sessionId)!;

      // 加入用戶訊息
      history.push({ role: "user", content: message });

      // 發送處理中狀態
      ws.send(JSON.stringify({ type: "thinking", message: "思考中..." }));

      // 使用 Claude Agent SDK
      const response = await claudeQuery({
        system: SYSTEM_PROMPT,
        messages: history,
        tools: Object.values(tools),
      });

      const assistantMessage = response.content;
      history.push({ role: "assistant", content: assistantMessage });

      ws.send(JSON.stringify({
        type: "response",
        message: assistantMessage,
        sessionId,
      }));
    } catch (error) {
      console.error("Agent WebSocket error:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: String(error),
      }));
    }
  },
  onClose: () => {
    console.log("Agent WebSocket disconnected");
  },
})));

// 清除 session
agentRoutes.delete("/session/:id", (c) => {
  const id = c.req.param("id");
  sessions.delete(id);
  return c.json({ message: "Session cleared" });
});
