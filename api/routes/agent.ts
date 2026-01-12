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
  title: string | null;
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
async function saveSession(clientSessionId: string, sdkSessionId: string, title?: string): Promise<void> {
  await query(
    `INSERT INTO agent_sessions (client_session_id, sdk_session_id, title)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_session_id)
     DO UPDATE SET sdk_session_id = $2, updated_at = NOW()`,
    [clientSessionId, sdkSessionId, title || null]
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
    "--allow-write",
    "--allow-run",
    "--allow-sys",
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
  const isNewSession = !sdkSessionId;

  // 執行 Agent Worker，傳入 resume session ID
  const result = await runAgentWorker(userMessage, sdkSessionId || undefined);

  // 儲存 SDK session ID 到資料庫（新 session 時記錄第一則訊息作為 title）
  if (result.sessionId) {
    const title = isNewSession ? userMessage.substring(0, 255) : undefined;
    await saveSession(clientSessionId, result.sessionId, title);
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

// 取得特定 session 的對話歷史
agentRoutes.get("/session/:id/history", async (c) => {
  const clientId = c.req.param("id");

  // 取得 SDK session ID
  const rows = await query<AgentSession>(
    "SELECT sdk_session_id FROM agent_sessions WHERE client_session_id = $1",
    [clientId]
  );

  if (!rows[0]?.sdk_session_id) {
    return c.json({ error: "Session not found" }, 404);
  }

  const sdkSessionId = rows[0].sdk_session_id;
  const homeDir = Deno.env.get("HOME") || "";
  const projectDir = `${homeDir}/.claude/projects/-Users-kaellim-Desktop-projects-60-api`;
  const sessionFile = `${projectDir}/${sdkSessionId}.jsonl`;

  try {
    const content = await Deno.readTextFile(sessionFile);
    const lines = content.trim().split("\n").filter(line => line);

    const messages: { role: string; content: string; timestamp: string }[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // 只取 user 和 assistant 類型的訊息
        if (entry.type === "user" && entry.message?.content) {
          const textContent = entry.message.content
            .filter((c: { type: string }) => c.type === "text")
            .map((c: { text: string }) => c.text)
            .join("\n");

          if (textContent) {
            messages.push({
              role: "user",
              content: textContent,
              timestamp: entry.timestamp,
            });
          }
        } else if (entry.type === "assistant" && entry.message?.content) {
          const textContent = entry.message.content
            .filter((c: { type: string }) => c.type === "text")
            .map((c: { text: string }) => c.text)
            .join("\n");

          if (textContent) {
            messages.push({
              role: "assistant",
              content: textContent,
              timestamp: entry.timestamp,
            });
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    return c.json({ messages });
  } catch {
    return c.json({ messages: [] });
  }
});

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

// 刪除 SDK session 檔案
async function deleteSdkSessionFiles(sdkSessionId: string): Promise<void> {
  const homeDir = Deno.env.get("HOME") || "";
  const claudeDir = `${homeDir}/.claude`;

  // 取得專案路徑 (根據 agent-worker 執行位置)
  const projectDir = `${claudeDir}/projects/-Users-kaellim-Desktop-projects-60-api`;

  const filesToDelete = [
    `${projectDir}/${sdkSessionId}.jsonl`,
    `${claudeDir}/debug/${sdkSessionId}.txt`,
  ];

  const dirsToDelete = [
    `${projectDir}/${sdkSessionId}`,
  ];

  // 刪除 todos 相關檔案 (可能有多個)
  try {
    for await (const entry of Deno.readDir(`${claudeDir}/todos`)) {
      if (entry.name.includes(sdkSessionId)) {
        filesToDelete.push(`${claudeDir}/todos/${entry.name}`);
      }
    }
  } catch {
    // todos 目錄可能不存在
  }

  // 刪除檔案
  for (const file of filesToDelete) {
    try {
      await Deno.remove(file);
      console.log(`Deleted: ${file}`);
    } catch {
      // 檔案可能不存在
    }
  }

  // 刪除目錄
  for (const dir of dirsToDelete) {
    try {
      await Deno.remove(dir, { recursive: true });
      console.log(`Deleted dir: ${dir}`);
    } catch {
      // 目錄可能不存在
    }
  }
}

// 清除特定 session
agentRoutes.delete("/session/:id", async (c) => {
  const clientId = c.req.param("id");

  // 先取得 SDK session ID
  const rows = await query<AgentSession>(
    "SELECT sdk_session_id FROM agent_sessions WHERE client_session_id = $1",
    [clientId]
  );

  if (rows[0]?.sdk_session_id) {
    await deleteSdkSessionFiles(rows[0].sdk_session_id);
  }

  await query("DELETE FROM agent_sessions WHERE client_session_id = $1", [clientId]);
  return c.json({ message: "Session cleared", sdkSessionDeleted: !!rows[0]?.sdk_session_id });
});

// 清除所有 sessions
agentRoutes.delete("/sessions", async (c) => {
  // 取得所有 SDK session IDs
  const sessions = await query<AgentSession>("SELECT sdk_session_id FROM agent_sessions");

  // 刪除所有 SDK session 檔案
  for (const session of sessions) {
    if (session.sdk_session_id) {
      await deleteSdkSessionFiles(session.sdk_session_id);
    }
  }

  await query("DELETE FROM agent_sessions");
  return c.json({ message: `Cleared ${sessions.length} sessions (including SDK files)` });
});
