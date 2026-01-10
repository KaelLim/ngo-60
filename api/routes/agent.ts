/**
 * AI 聊天式管理後台 - Agent 路由
 * 使用 Claude Agent SDK (透過 Worker 執行)
 */

import { Hono } from "jsr:@hono/hono@^4.6.0";
import { upgradeWebSocket } from "jsr:@hono/hono@^4.6.0/deno";

// 儲存 SDK session ID 對應 (clientSessionId -> sdkSessionId)
const sessionMap = new Map<string, string>();

// 執行 Agent Worker
async function runAgentWorker(prompt: string, resumeSessionId?: string): Promise<{ message: string; sessionId: string }> {
  const workerPath = new URL("../agent-worker.ts", import.meta.url).pathname;

  const args = [
    "run",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--allow-run",
    workerPath,
    prompt
  ];

  // 如果有 resume session ID，加入參數
  if (resumeSessionId) {
    args.push(resumeSessionId);
  }

  const command = new Deno.Command("deno", {
    args,
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
    // 取得最後一行 JSON 輸出
    const lines = output.trim().split('\n');
    const lastLine = lines[lines.length - 1];
    const result = JSON.parse(lastLine);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      message: result.message || "",
      sessionId: result.sessionId || ""
    };
  } catch (e) {
    throw new Error(`Worker output parse error: ${output}`);
  }
}

// 處理聊天請求的核心邏輯
async function processChat(clientSessionId: string, userMessage: string): Promise<{ message: string; sessionId: string }> {
  // 查找是否有對應的 SDK session ID
  const sdkSessionId = sessionMap.get(clientSessionId);

  // 執行 Agent Worker，傳入 resume session ID
  const result = await runAgentWorker(userMessage, sdkSessionId);

  // 儲存 SDK session ID 對應
  if (result.sessionId) {
    sessionMap.set(clientSessionId, result.sessionId);
  }

  return result;
}

export const agentRoutes = new Hono();

// HTTP API endpoint for chat
agentRoutes.post("/chat", async (c) => {
  const body = await c.req.json();
  const message = body.message;
  const clientSessionId = body.sessionId || crypto.randomUUID();

  try {
    const result = await processChat(clientSessionId, message);
    return c.json({
      success: true,
      message: result.message,
      sessionId: clientSessionId,  // 回傳 client 使用的 session ID
      sdkSessionId: result.sessionId,  // 也回傳 SDK 的 session ID (供除錯)
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
      const clientSessionId = data.sessionId || crypto.randomUUID();

      // 發送處理中狀態
      ws.send(JSON.stringify({ type: "thinking", message: "思考中..." }));

      const result = await processChat(clientSessionId, message);

      ws.send(JSON.stringify({
        type: "response",
        message: result.message,
        sessionId: clientSessionId,
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

// 查看所有 sessions
agentRoutes.get("/sessions", (c) => {
  const sessionList = Array.from(sessionMap.entries()).map(([clientId, sdkId]) => ({
    clientSessionId: clientId,
    sdkSessionId: sdkId
  }));
  return c.json({
    total: sessionMap.size,
    sessions: sessionList
  });
});

// 清除特定 session
agentRoutes.delete("/session/:id", (c) => {
  const id = c.req.param("id");
  sessionMap.delete(id);
  return c.json({ message: "Session cleared" });
});

// 清除所有 sessions
agentRoutes.delete("/sessions", (c) => {
  const count = sessionMap.size;
  sessionMap.clear();
  return c.json({ message: `Cleared ${count} sessions` });
});
