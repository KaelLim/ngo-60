/**
 * Agent Worker - 獨立執行 Claude Agent SDK
 * 透過 stdin/stdout 與主程序通訊
 */

import { query as claudeQuery, tool, createSdkMcpServer } from "npm:@anthropic-ai/claude-agent-sdk";
import { z } from "npm:zod";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

// 資料庫連線
const pool = new Pool({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: 5432,
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "postgres",
  database: Deno.env.get("DB_NAME") || "events_app",
}, 3);

async function query<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}

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

// 定義工具
const tools = [
  tool("getTopics", "取得所有主題列表", {}, async () => {
    const rows = await query<Topic>("SELECT * FROM topics ORDER BY sort_order");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("getTopic", "取得單一主題詳情", { id: z.number() }, async (input) => {
    const topicRows = await query<Topic>("SELECT * FROM topics WHERE id = $1", [input.id]);
    if (!topicRows[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "主題不存在" }) }] };
    const eventRows = await query<Event>("SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start", [input.id]);
    return { content: [{ type: "text" as const, text: JSON.stringify({ ...topicRows[0], events: eventRows }, null, 2) }] };
  }),

  tool("getEvents", "取得活動列表", {
    month: z.number().optional(),
    year: z.number().optional(),
    topic_id: z.number().optional()
  }, async (input) => {
    let rows: Event[];
    if (input.topic_id) {
      rows = await query<Event>("SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start", [input.topic_id]);
    } else if (input.month && input.year) {
      rows = await query<Event>("SELECT * FROM events WHERE month = $1 AND year = $2 ORDER BY date_start", [input.month, input.year]);
    } else if (input.month) {
      rows = await query<Event>("SELECT * FROM events WHERE month = $1 ORDER BY date_start", [input.month]);
    } else {
      rows = await query<Event>("SELECT * FROM events ORDER BY date_start");
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("getBlessings", "取得祝福語列表", { featured: z.boolean().optional() }, async (input) => {
    const rows = input.featured
      ? await query<Blessing>("SELECT * FROM blessings WHERE is_featured = true ORDER BY sort_order")
      : await query<Blessing>("SELECT * FROM blessings ORDER BY sort_order");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("getImpact", "取得影響力區塊資料", {}, async () => {
    const rows = await query<ImpactSection>("SELECT * FROM impact_sections ORDER BY sort_order");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("getHomepage", "取得首頁內容", {}, async () => {
    const rows = await query<Homepage>("SELECT * FROM homepage ORDER BY id LIMIT 1");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows[0] || { error: "首頁內容不存在" }, null, 2) }] };
  }),

  tool("updateHomepage", "更新首頁內容", {
    slogan: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional()
  }, async (input) => {
    const existing = await query<Homepage>("SELECT id FROM homepage LIMIT 1");
    let result: Homepage;
    if (existing.length > 0) {
      const rows = await query<Homepage>(
        `UPDATE homepage SET slogan = COALESCE($1, slogan), title = COALESCE($2, title), content = COALESCE($3, content), updated_at = NOW() WHERE id = $4 RETURNING *`,
        [input.slogan, input.title, input.content, existing[0].id]
      );
      result = rows[0];
    } else {
      const rows = await query<Homepage>(
        `INSERT INTO homepage (slogan, title, content) VALUES ($1, $2, $3) RETURNING *`,
        [input.slogan, input.title, input.content]
      );
      result = rows[0];
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }),

  tool("getGallery", "取得圖片庫列表", { random: z.boolean().optional(), count: z.number().optional() }, async (input) => {
    const rows = input.random
      ? await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true ORDER BY RANDOM() LIMIT $1", [input.count || 15])
      : await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true ORDER BY uploaded_at DESC");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("deleteGalleryImage", "刪除圖片庫中的圖片", { id: z.number() }, async (input) => {
    const rows = await query<GalleryImage>("UPDATE gallery SET is_active = false WHERE id = $1 RETURNING *", [input.id]);
    if (rows.length === 0) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "圖片不存在" }) }] };
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "圖片已刪除", image: rows[0] }, null, 2) }] };
  }),
];

const SYSTEM_PROMPT = `你是慈濟 60 週年活動網站的 AI 管理助手。

你可以幫助用戶：
1. 查詢和管理主題 (Topics) - 使用 getTopics, getTopic
2. 查詢和管理活動時程 (Events) - 使用 getEvents
3. 查詢和管理祝福語 (Blessings) - 使用 getBlessings
4. 查詢影響力數據 (Impact) - 使用 getImpact
5. 更新首頁內容 (Homepage) - 使用 getHomepage, updateHomepage
6. 管理圖片庫 (Gallery) - 使用 getGallery, deleteGalleryImage

請用繁體中文回覆，並且友善地引導用戶。
當執行操作後，請清楚說明結果。`;

// 主程式：讀取 stdin，執行查詢，輸出結果
async function main() {
  // 從命令行參數獲取 prompt
  const prompt = Deno.args[0];
  if (!prompt) {
    console.error(JSON.stringify({ error: "No prompt provided" }));
    Deno.exit(1);
  }

  const mcpServer = createSdkMcpServer({
    name: "tzu-chi-60-admin",
    version: "1.0.0",
    tools,
  });

  try {
    const result = claudeQuery({
      prompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        mcpServers: {
          "tzu-chi-admin": mcpServer,
        },
      }
    });

    let response = "";
    for await (const event of result) {
      if (event.type === "assistant" && event.message?.content) {
        for (const block of event.message.content) {
          if (block.type === "text") {
            response = block.text;
          }
        }
      } else if (event.type === "result" && event.subtype === "success" && event.result) {
        response = event.result;
      }
    }

    console.log(JSON.stringify({ success: true, message: response }));
  } catch (error) {
    console.error(JSON.stringify({ error: String(error) }));
    Deno.exit(1);
  }
}

main();
