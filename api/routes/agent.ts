/**
 * AI 聊天式管理後台 - Agent 路由
 * 使用 Claude Agent SDK (透過 Worker 執行)
 */

import { Hono } from "jsr:@hono/hono@^4.6.0";
import { upgradeWebSocket } from "jsr:@hono/hono@^4.6.0/deno";

// 儲存對話歷史
const sessions = new Map<string, string[]>();

// 執行 Agent Worker
async function runAgentWorker(prompt: string): Promise<string> {
  const workerPath = new URL("../agent-worker.ts", import.meta.url).pathname;

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-net",
      "--allow-env",
      "--allow-read",
      "--allow-run",
      workerPath,
      prompt
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const process = command.spawn();
  const { stdout, stderr } = await process.output();

  const output = new TextDecoder().decode(stdout);
  const errorOutput = new TextDecoder().decode(stderr);

  if (errorOutput) {
    console.error("Agent Worker stderr:", errorOutput);
  }

  try {
    const result = JSON.parse(output.trim().split('\n').pop() || '{}');
    if (result.error) {
      throw new Error(result.error);
    }
    return result.message || "";
  } catch {
    // 如果 output 不是 JSON，可能是直接的文字回應
    if (output.includes('"success":true')) {
      const match = output.match(/"message":"([^"]+)"/);
      return match ? match[1] : output;
    }
    throw new Error(`Worker output parse error: ${output}`);
  }
}

// 處理聊天請求的核心邏輯
async function processChat(sessionId: string, userMessage: string): Promise<string> {
  // 取得或建立 session 歷史
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  const history = sessions.get(sessionId)!;
  history.push(`User: ${userMessage}`);

  // 組合 prompt
  const prompt = history.length > 1
    ? `對話歷史:\n${history.slice(0, -1).join('\n')}\n\n最新訊息: ${userMessage}\n\n請回覆用戶的最新訊息。`
    : userMessage;

  // 執行 Agent Worker
  const response = await runAgentWorker(prompt);

  // 儲存回覆
  history.push(`Assistant: ${response}`);

  // 限制歷史長度
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }

  return response;
}

export const agentRoutes = new Hono();

// HTTP API endpoint for chat
agentRoutes.post("/chat", async (c) => {
  const body = await c.req.json();
  const message = body.message;
  const sessionId = body.sessionId || crypto.randomUUID();

  try {
    const response = await processChat(sessionId, message);
    return c.json({
      success: true,
      message: response,
      sessionId,
    });
  } catch (error) {
    console.error("Agent error:", error);
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
      const message = data.message;
      const sessionId = data.sessionId || crypto.randomUUID();

      // 發送處理中狀態
      ws.send(JSON.stringify({ type: "thinking", message: "思考中..." }));

      const response = await processChat(sessionId, message);

      ws.send(JSON.stringify({
        type: "response",
        message: response,
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
