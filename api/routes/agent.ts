/**
 * AI 聊天式管理後台 - Agent 路由
 * 使用 Claude Agent SDK (透過 Worker 執行)
 * Session 儲存在 PostgreSQL
 */

import { Hono } from "jsr:@hono/hono@^4.6.0";
import { upgradeWebSocket } from "jsr:@hono/hono@^4.6.0/deno";
import { query } from "../db.ts";

// Session 資料類型
interface AgentSession {
  id: number;
  client_session_id: string;
  sdk_session_id: string;
  created_at: string;
  updated_at: string;
}

// 取得 SDK session ID
async function getSdkSessionId(clientSessionId: string): Promise<string | null> {
  const rows = await query<AgentSession>(
    "SELECT sdk_session_id FROM agent_sessions WHERE client_session_id = $1",
    [clientSessionId]
  );
  return rows[0]?.sdk_session_id || null;
}

// 儲存 session 對應
async function saveSession(clientSessionId: string, sdkSessionId: string): Promise<void> {
  await query(
    `INSERT INTO agent_sessions (client_session_id, sdk_session_id)
     VALUES ($1, $2)
     ON CONFLICT (client_session_id)
     DO UPDATE SET sdk_session_id = $2, updated_at = NOW()`,
    [clientSessionId, sdkSessionId]
  );
}

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
  } catch {
    throw new Error(`Worker output parse error: ${output}`);
  }
}

// 處理聊天請求的核心邏輯
async function processChat(clientSessionId: string, userMessage: string): Promise<{ message: string; sessionId: string }> {
  // 從資料庫查找對應的 SDK session ID
  const sdkSessionId = await getSdkSessionId(clientSessionId);

  // 執行 Agent Worker，傳入 resume session ID
  const result = await runAgentWorker(userMessage, sdkSessionId || undefined);

  // 儲存 SDK session ID 到資料庫
  if (result.sessionId) {
    await saveSession(clientSessionId, result.sessionId);
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
      sessionId: clientSessionId,
      sdkSessionId: result.sessionId,
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
agentRoutes.get("/sessions", async (c) => {
  const rows = await query<AgentSession>(
    "SELECT * FROM agent_sessions ORDER BY updated_at DESC"
  );
  return c.json({
    total: rows.length,
    sessions: rows
  });
});

// 清除特定 session
agentRoutes.delete("/session/:id", async (c) => {
  const id = c.req.param("id");
  await query("DELETE FROM agent_sessions WHERE client_session_id = $1", [id]);
  return c.json({ message: "Session cleared" });
});

// 清除所有 sessions
agentRoutes.delete("/sessions", async (c) => {
  const result = await query<{ count: number }>("SELECT COUNT(*) as count FROM agent_sessions");
  const count = result[0]?.count || 0;
  await query("DELETE FROM agent_sessions");
  return c.json({ message: `Cleared ${count} sessions` });
});
