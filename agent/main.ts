/**
 * 慈濟 60 週年活動網站 - AI 聊天式管理後台
 * 使用 Claude Agent SDK + Deno + Hono
 */

import { Hono } from "jsr:@hono/hono@^4.6.0";
import { cors } from "jsr:@hono/hono@^4.6.0/cors";
import { upgradeWebSocket } from "jsr:@hono/hono@^4.6.0/deno";
import {
  query as claudeQuery,
  tool,
} from "npm:@anthropic-ai/claude-agent-sdk";

const app = new Hono();
app.use("/*", cors());

// API Base URL
const API_BASE = "http://localhost:8000/api";

// 定義 Claude 可以使用的工具
const tools = {
  // 查詢主題
  getTopics: tool({
    description: "取得所有主題列表",
    parameters: {},
    execute: async () => {
      const res = await fetch(`${API_BASE}/topics`);
      return await res.json();
    },
  }),

  // 取得單一主題
  getTopic: tool({
    description: "取得單一主題詳情，包含相關活動",
    parameters: {
      id: { type: "number", description: "主題 ID" },
    },
    execute: async ({ id }) => {
      const res = await fetch(`${API_BASE}/topics/${id}`);
      return await res.json();
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
    execute: async ({ month, year, topic_id }) => {
      const params = new URLSearchParams();
      if (month) params.set("month", String(month));
      if (year) params.set("year", String(year));
      if (topic_id) params.set("topic_id", String(topic_id));
      const res = await fetch(`${API_BASE}/events?${params}`);
      return await res.json();
    },
  }),

  // 查詢祝福語
  getBlessings: tool({
    description: "取得祝福語列表",
    parameters: {
      featured: { type: "boolean", description: "是否只取精選", optional: true },
    },
    execute: async ({ featured }) => {
      const url = featured ? `${API_BASE}/blessings?featured=true` : `${API_BASE}/blessings`;
      const res = await fetch(url);
      return await res.json();
    },
  }),

  // 查詢影響力區塊
  getImpact: tool({
    description: "取得影響力區塊資料",
    parameters: {},
    execute: async () => {
      const res = await fetch(`${API_BASE}/impact`);
      return await res.json();
    },
  }),

  // 取得首頁內容
  getHomepage: tool({
    description: "取得首頁內容（標語、標題、說明）",
    parameters: {},
    execute: async () => {
      const res = await fetch(`${API_BASE}/homepage`);
      return await res.json();
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
    execute: async ({ slogan, title, content }) => {
      const res = await fetch(`${API_BASE}/homepage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slogan, title, content }),
      });
      return await res.json();
    },
  }),

  // 取得圖片庫
  getGallery: tool({
    description: "取得圖片庫列表",
    parameters: {
      random: { type: "boolean", description: "是否隨機取得", optional: true },
      count: { type: "number", description: "隨機取得的數量", optional: true },
    },
    execute: async ({ random, count }) => {
      const url = random
        ? `${API_BASE}/gallery/random?count=${count || 15}`
        : `${API_BASE}/gallery`;
      const res = await fetch(url);
      return await res.json();
    },
  }),

  // 刪除圖片
  deleteGalleryImage: tool({
    description: "刪除圖片庫中的圖片",
    parameters: {
      id: { type: "number", description: "圖片 ID" },
    },
    execute: async ({ id }) => {
      const res = await fetch(`${API_BASE}/gallery/${id}`, {
        method: "DELETE",
      });
      return await res.json();
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

// HTTP API endpoint for chat
app.post("/chat", async (c) => {
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
app.get("/ws", upgradeWebSocket((c) => ({
  onOpen: (_event, ws) => {
    console.log("WebSocket connected");
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
      console.error("WebSocket error:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: String(error),
      }));
    }
  },
  onClose: () => {
    console.log("WebSocket disconnected");
  },
})));

// 健康檢查
app.get("/health", (c) => c.json({ status: "ok", service: "ai-agent" }));

console.log("AI Agent Server running on http://localhost:8001");
Deno.serve({ port: 8001 }, app.fetch);
