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
  participation_type: string | null;
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
  category: string;
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

  tool("createTopic", "新增主題", {
    name: z.string(),
    icon: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    background_image: z.string().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const rows = await query<Topic>(
      `INSERT INTO topics (name, subtitle, description, icon, background_image, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.name, input.subtitle || null, input.description || null, input.icon, input.background_image || null, input.sort_order || 0]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "主題已新增", topic: rows[0] }, null, 2) }] };
  }),

  tool("updateTopic", "更新主題", {
    id: z.number(),
    name: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    background_image: z.string().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const existing = await query<Topic>("SELECT * FROM topics WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "主題不存在" }) }] };
    const e = existing[0];
    const rows = await query<Topic>(
      `UPDATE topics SET name = $1, subtitle = $2, description = $3, icon = $4, background_image = $5, sort_order = $6
       WHERE id = $7 RETURNING *`,
      [input.name ?? e.name, input.subtitle ?? e.subtitle, input.description ?? e.description, input.icon ?? e.icon, input.background_image ?? e.background_image, input.sort_order ?? e.sort_order, input.id]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "主題已更新", topic: rows[0] }, null, 2) }] };
  }),

  tool("deleteTopic", "刪除主題", { id: z.number() }, async (input) => {
    const existing = await query<Topic>("SELECT * FROM topics WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "主題不存在" }) }] };
    // 檢查是否有關聯的活動
    const relatedEvents = await query<Event>("SELECT id FROM events WHERE topic_id = $1", [input.id]);
    if (relatedEvents.length > 0) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: "無法刪除此主題，因為還有 " + relatedEvents.length + " 個關聯活動" }) }] };
    }
    await query("DELETE FROM topics WHERE id = $1", [input.id]);
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "主題已刪除", id: input.id }, null, 2) }] };
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

  tool("createEvent", "新增活動", {
    title: z.string(),
    date_start: z.string(),
    month: z.number(),
    year: z.number(),
    description: z.string().optional(),
    date_end: z.string().optional(),
    participation_type: z.string().optional(),
    image_url: z.string().optional(),
    topic_id: z.number().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const rows = await query<Event>(
      `INSERT INTO events (title, description, date_start, date_end, participation_type, image_url, topic_id, month, year, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [input.title, input.description || null, input.date_start, input.date_end || null, input.participation_type || null, input.image_url || null, input.topic_id || null, input.month, input.year, input.sort_order || 0]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "活動已新增", event: rows[0] }, null, 2) }] };
  }),

  tool("updateEvent", "更新活動", {
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    date_start: z.string().optional(),
    date_end: z.string().optional(),
    participation_type: z.string().optional(),
    image_url: z.string().optional(),
    topic_id: z.number().optional(),
    month: z.number().optional(),
    year: z.number().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const existing = await query<Event>("SELECT * FROM events WHERE id = $1", [input.id]);
    if (!existing[0]) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: "活動不存在" }) }] };
    }
    const e = existing[0];
    const rows = await query<Event>(
      `UPDATE events SET
        title = $1, description = $2, date_start = $3, date_end = $4,
        participation_type = $5, image_url = $6, topic_id = $7,
        month = $8, year = $9, sort_order = $10
       WHERE id = $11 RETURNING *`,
      [
        input.title ?? e.title,
        input.description ?? e.description,
        input.date_start ?? e.date_start,
        input.date_end ?? e.date_end,
        input.participation_type ?? e.participation_type,
        input.image_url ?? e.image_url,
        input.topic_id ?? e.topic_id,
        input.month ?? e.month,
        input.year ?? e.year,
        input.sort_order ?? e.sort_order,
        input.id
      ]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "活動已更新", event: rows[0] }, null, 2) }] };
  }),

  tool("deleteEvent", "刪除活動", { id: z.number() }, async (input) => {
    const existing = await query<Event>("SELECT * FROM events WHERE id = $1", [input.id]);
    if (!existing[0]) {
      return { content: [{ type: "text" as const, text: JSON.stringify({ error: "活動不存在" }) }] };
    }
    await query("DELETE FROM events WHERE id = $1", [input.id]);
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "活動已刪除", id: input.id }, null, 2) }] };
  }),

  tool("getBlessings", "取得祝福語列表", { featured: z.boolean().optional() }, async (input) => {
    const rows = input.featured
      ? await query<Blessing>("SELECT * FROM blessings WHERE is_featured = true ORDER BY sort_order")
      : await query<Blessing>("SELECT * FROM blessings ORDER BY sort_order");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("createBlessing", "新增祝福語", {
    author: z.string(),
    message: z.string(),
    full_content: z.string().optional(),
    image_url: z.string().optional(),
    is_featured: z.boolean().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const rows = await query<Blessing>(
      `INSERT INTO blessings (author, message, full_content, image_url, is_featured, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.author, input.message, input.full_content || null, input.image_url || null, input.is_featured || false, input.sort_order || 0]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "祝福語已新增", blessing: rows[0] }, null, 2) }] };
  }),

  tool("updateBlessing", "更新祝福語", {
    id: z.number(),
    author: z.string().optional(),
    message: z.string().optional(),
    full_content: z.string().optional(),
    image_url: z.string().optional(),
    is_featured: z.boolean().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const existing = await query<Blessing>("SELECT * FROM blessings WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "祝福語不存在" }) }] };
    const e = existing[0];
    const rows = await query<Blessing>(
      `UPDATE blessings SET author = $1, message = $2, full_content = $3, image_url = $4, is_featured = $5, sort_order = $6
       WHERE id = $7 RETURNING *`,
      [input.author ?? e.author, input.message ?? e.message, input.full_content ?? e.full_content, input.image_url ?? e.image_url, input.is_featured ?? e.is_featured, input.sort_order ?? e.sort_order, input.id]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "祝福語已更新", blessing: rows[0] }, null, 2) }] };
  }),

  tool("deleteBlessing", "刪除祝福語", { id: z.number() }, async (input) => {
    const existing = await query<Blessing>("SELECT * FROM blessings WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "祝福語不存在" }) }] };
    await query("DELETE FROM blessings WHERE id = $1", [input.id]);
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "祝福語已刪除", id: input.id }, null, 2) }] };
  }),

  tool("getImpact", "取得影響力區塊資料", {}, async () => {
    const rows = await query<ImpactSection>("SELECT * FROM impact_sections ORDER BY sort_order");
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("createImpact", "新增影響力區塊", {
    name: z.string(),
    icon: z.string(),
    stat_value: z.string().optional(),
    stat_label: z.string().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const rows = await query<ImpactSection>(
      `INSERT INTO impact_sections (name, icon, stat_value, stat_label, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.name, input.icon, input.stat_value || null, input.stat_label || null, input.sort_order || 0]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "影響力區塊已新增", impact: rows[0] }, null, 2) }] };
  }),

  tool("updateImpact", "更新影響力區塊", {
    id: z.number(),
    name: z.string().optional(),
    icon: z.string().optional(),
    stat_value: z.string().optional(),
    stat_label: z.string().optional(),
    sort_order: z.number().optional()
  }, async (input) => {
    const existing = await query<ImpactSection>("SELECT * FROM impact_sections WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "影響力區塊不存在" }) }] };
    const e = existing[0];
    const rows = await query<ImpactSection>(
      `UPDATE impact_sections SET name = $1, icon = $2, stat_value = $3, stat_label = $4, sort_order = $5
       WHERE id = $6 RETURNING *`,
      [input.name ?? e.name, input.icon ?? e.icon, input.stat_value ?? e.stat_value, input.stat_label ?? e.stat_label, input.sort_order ?? e.sort_order, input.id]
    );
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "影響力區塊已更新", impact: rows[0] }, null, 2) }] };
  }),

  tool("deleteImpact", "刪除影響力區塊", { id: z.number() }, async (input) => {
    const existing = await query<ImpactSection>("SELECT * FROM impact_sections WHERE id = $1", [input.id]);
    if (!existing[0]) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "影響力區塊不存在" }) }] };
    await query("DELETE FROM impact_sections WHERE id = $1", [input.id]);
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "影響力區塊已刪除", id: input.id }, null, 2) }] };
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

  tool("getGallery", "取得圖片庫列表", {
    random: z.boolean().optional(),
    count: z.number().optional(),
    category: z.string().optional()
  }, async (input) => {
    let rows: GalleryImage[];
    if (input.category) {
      rows = input.random
        ? await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true AND category = $1 ORDER BY RANDOM() LIMIT $2", [input.category, input.count || 15])
        : await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true AND category = $1 ORDER BY uploaded_at DESC", [input.category]);
    } else {
      rows = input.random
        ? await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true ORDER BY RANDOM() LIMIT $1", [input.count || 15])
        : await query<GalleryImage>("SELECT * FROM gallery WHERE is_active = true ORDER BY uploaded_at DESC");
    }
    return { content: [{ type: "text" as const, text: JSON.stringify(rows, null, 2) }] };
  }),

  tool("updateGalleryImage", "更新圖片分類", {
    id: z.number(),
    category: z.string()
  }, async (input) => {
    const rows = await query<GalleryImage>(
      "UPDATE gallery SET category = $1 WHERE id = $2 AND is_active = true RETURNING *",
      [input.category, input.id]
    );
    if (rows.length === 0) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "圖片不存在" }) }] };
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "圖片分類已更新", image: rows[0] }, null, 2) }] };
  }),

  tool("deleteGalleryImage", "刪除圖片庫中的圖片", { id: z.number() }, async (input) => {
    const rows = await query<GalleryImage>("UPDATE gallery SET is_active = false WHERE id = $1 RETURNING *", [input.id]);
    if (rows.length === 0) return { content: [{ type: "text" as const, text: JSON.stringify({ error: "圖片不存在" }) }] };
    return { content: [{ type: "text" as const, text: JSON.stringify({ message: "圖片已刪除", image: rows[0] }, null, 2) }] };
  }),
];

const SYSTEM_PROMPT = `你是慈濟 60 週年活動網站的 AI 管理助手。

你可以幫助用戶：
1. 管理主題 (Topics) - 使用 getTopics, getTopic, createTopic, updateTopic, deleteTopic
2. 管理活動時程 (Events) - 使用 getEvents, createEvent, updateEvent, deleteEvent
3. 管理祝福語 (Blessings) - 使用 getBlessings, createBlessing, updateBlessing, deleteBlessing
4. 管理影響力數據 (Impact) - 使用 getImpact, createImpact, updateImpact, deleteImpact
5. 更新首頁內容 (Homepage) - 使用 getHomepage, updateHomepage
6. 管理圖片庫 (Gallery) - 使用 getGallery, updateGalleryImage, deleteGalleryImage

主題 (Topics) 操作說明：
- getTopics: 查詢所有主題列表
- getTopic: 查詢單一主題詳情（含相關活動）
- createTopic: 新增主題，必填 name, icon
- updateTopic: 更新主題，必填 id，其他欄位可選
- deleteTopic: 刪除主題，必填 id（如有關聯活動則無法刪除）

活動 (Events) 操作說明：
- getEvents: 查詢活動列表，可依 month, year, topic_id 篩選
- createEvent: 新增活動，必填 title, date_start, month, year
- updateEvent: 更新活動，必填 id，其他欄位可選
- deleteEvent: 刪除活動，必填 id

祝福語 (Blessings) 操作說明：
- getBlessings: 查詢祝福語列表，可用 featured=true 篩選精選
- createBlessing: 新增祝福語，必填 author, message
- updateBlessing: 更新祝福語，必填 id，其他欄位可選
- deleteBlessing: 刪除祝福語，必填 id

影響力 (Impact) 操作說明：
- getImpact: 查詢所有影響力區塊
- createImpact: 新增影響力區塊，必填 name, icon
- updateImpact: 更新影響力區塊，必填 id，其他欄位可選
- deleteImpact: 刪除影響力區塊，必填 id

圖片庫 (Gallery) 操作說明：
- getGallery: 查詢圖片列表，可用 category 篩選類別，random=true 隨機排序
- updateGalleryImage: 更新圖片分類，必填 id 和 category
- deleteGalleryImage: 刪除圖片，必填 id

圖片分類 (category) 說明：
- homepage: 首頁 60 Grid 圖片
- events: 活動封面圖
- topics: 主題背景圖
- blessings: 祝福語圖片
- general: 一般圖片（預設）

請用繁體中文回覆，並且友善地引導用戶。
當執行操作後，請清楚說明結果。`;

// 主程式：讀取參數，執行查詢，輸出結果
async function main() {
  // 從命令行參數獲取 prompt 和可選的 resumeSessionId
  const prompt = Deno.args[0];
  const resumeSessionId = Deno.args[1] || undefined;

  if (!prompt) {
    console.error(JSON.stringify({ error: "No prompt provided" }));
    Deno.exit(1);
  }

  const mcpServer = createSdkMcpServer({
    name: "tzu-chi-60-admin",
    version: "1.0.0",
    tools,
  });

  // 定義允許的 MCP 工具列表
  const allowedTools = [
    "mcp__tzu-chi-admin__getTopics",
    "mcp__tzu-chi-admin__getTopic",
    "mcp__tzu-chi-admin__createTopic",
    "mcp__tzu-chi-admin__updateTopic",
    "mcp__tzu-chi-admin__deleteTopic",
    "mcp__tzu-chi-admin__getEvents",
    "mcp__tzu-chi-admin__createEvent",
    "mcp__tzu-chi-admin__updateEvent",
    "mcp__tzu-chi-admin__deleteEvent",
    "mcp__tzu-chi-admin__getBlessings",
    "mcp__tzu-chi-admin__createBlessing",
    "mcp__tzu-chi-admin__updateBlessing",
    "mcp__tzu-chi-admin__deleteBlessing",
    "mcp__tzu-chi-admin__getImpact",
    "mcp__tzu-chi-admin__createImpact",
    "mcp__tzu-chi-admin__updateImpact",
    "mcp__tzu-chi-admin__deleteImpact",
    "mcp__tzu-chi-admin__getHomepage",
    "mcp__tzu-chi-admin__updateHomepage",
    "mcp__tzu-chi-admin__getGallery",
    "mcp__tzu-chi-admin__updateGalleryImage",
    "mcp__tzu-chi-admin__deleteGalleryImage",
  ];

  try {
    const result = claudeQuery({
      prompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        resume: resumeSessionId,  // 恢復既有 session
        mcpServers: {
          "tzu-chi-admin": mcpServer,
        },
        // 以非 root 使用者執行時可使用 bypassPermissions
        permissionMode: "bypassPermissions",
        allowDangerouslySkipPermissions: true,
        // 明確允許 MCP 工具使用 (備用)
        allowedTools,
      }
    });

    let response = "";
    let sessionId = "";

    for await (const event of result) {
      // 從 system init 事件取得 session_id
      if (event.type === "system" && event.subtype === "init") {
        sessionId = event.session_id;
      }

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

    // 回傳 session_id 供後續 resume 使用
    console.log(JSON.stringify({ success: true, message: response, sessionId }));
  } catch (error) {
    console.error(JSON.stringify({ error: String(error) }));
    Deno.exit(1);
  }
}

main();
