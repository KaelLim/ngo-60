import { Hono } from "hono";
import { query } from "../db.ts";

interface Event {
  id: number;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  participation_type: string | null;
  image_url: string | null;
  link_url: string | null;
  topic_id: number | null;
  month: number;
  year: number;
  published: boolean;
  privacy: number;
  is_new: boolean;
  new_set_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const eventsRoutes = new Hono();

// Computed is_new: true only if is_new=true AND within 5 days of new_set_at
const IS_NEW_EXPR = `(is_new = true AND new_set_at IS NOT NULL AND new_set_at + INTERVAL '5 days' > NOW())`;
const EVENT_COLS = `id, title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, published, privacy, ${IS_NEW_EXPR} as is_new, new_set_at, sort_order, created_at, updated_at`;
const SELECT_EVENTS = `SELECT ${EVENT_COLS} FROM events`;

// GET /api/events - 取得活動列表
// 支援篩選: ?month=8&year=2026 或 ?topic_id=1
// 日期範圍邏輯: 活動 date_start~date_end 包含查詢月份就會顯示
// ?all=true 顯示所有活動（包含未發布），否則只顯示已發布的
eventsRoutes.get("/", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const topicId = c.req.query("topic_id");
  const showAll = c.req.query("all") === "true";

  // published 條件：showAll 時不篩選，否則只顯示 published = true
  const publishedCondition = showAll ? "" : "AND published = true";

  // 依主題篩選
  if (topicId) {
    const rows = await query<Event>(
      `${SELECT_EVENTS} WHERE topic_id = $1 ${publishedCondition} ORDER BY date_start`,
      [parseInt(topicId)]
    );
    return c.json(rows);
  }

  // 依月份和年份篩選 (只顯示起始月份的活動)
  if (month && year) {
    const rows = await query<Event>(
      `${SELECT_EVENTS}
       WHERE month = $1 AND year = $2
         ${publishedCondition}
       ORDER BY date_start`,
      [parseInt(month), parseInt(year)]
    );
    return c.json(rows);
  }

  // 僅依月份篩選 (假設當年)
  if (month) {
    const rows = await query<Event>(
      `${SELECT_EVENTS}
       WHERE month = $1 AND year = $2
         ${publishedCondition}
       ORDER BY date_start`,
      [parseInt(month), new Date().getFullYear()]
    );
    return c.json(rows);
  }

  // 取得所有活動
  const rows = await query<Event>(
    showAll
      ? `${SELECT_EVENTS} ORDER BY date_start`
      : `${SELECT_EVENTS} WHERE published = true ORDER BY date_start`
  );
  return c.json(rows);
});

// GET /api/events/active-months?year=2026 - 取得有活動的月份
eventsRoutes.get("/active-months", async (c) => {
  const year = c.req.query("year") || new Date().getFullYear().toString();
  const y = parseInt(year);
  const rows = await query<{ month: number }>(
    `SELECT DISTINCT month FROM events WHERE year = $1 AND published = true ORDER BY month`,
    [y]
  );
  return c.json(rows.map(r => r.month));
});

// GET /api/events/:id - 取得單一活動詳情
eventsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Event>(`${SELECT_EVENTS} WHERE id = $1`, [id]);
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});

// POST /api/events - 新增活動
eventsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const {
    title,
    description,
    date_start,
    date_end,
    participation_type,
    image_url,
    link_url,
    topic_id,
    month,
    year,
    published = true,
    privacy = 0,
    is_new = true
  } = body;

  if (!title || !date_start || !month || !year) {
    return c.json({ error: "title, date_start, month, year are required" }, 400);
  }

  const rows = await query<Event>(
    `INSERT INTO events (title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, published, privacy, is_new, new_set_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, ${is_new ? "NOW()" : "NULL"}, NOW(), NULL)
     RETURNING ${EVENT_COLS}`,
    [title, description || null, date_start, date_end || null, participation_type || null, image_url || null, link_url || null, topic_id || null, month, year, published, privacy, is_new]
  );

  return c.json(rows[0], 201);
});

// PUT /api/events/:id - 更新活動
eventsRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  // 先檢查活動是否存在
  const existing = await query<Event>("SELECT * FROM events WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Event not found" }, 404);
  }

  const {
    title = existing[0].title,
    description = existing[0].description,
    date_start = existing[0].date_start,
    date_end = existing[0].date_end,
    participation_type = existing[0].participation_type,
    image_url = existing[0].image_url,
    link_url = existing[0].link_url,
    topic_id = existing[0].topic_id,
    month = existing[0].month,
    year = existing[0].year,
    published = existing[0].published,
    privacy = existing[0].privacy,
  } = body;

  // is_new: if toggled to true, reset new_set_at; if toggled to false, keep old new_set_at
  const isNewChanged = body.is_new !== undefined;
  const newIsNew = body.is_new ?? existing[0].is_new;
  const newSetAtExpr = (isNewChanged && newIsNew) ? "NOW()" : (newIsNew && !existing[0].is_new) ? "NOW()" : "new_set_at";

  const rows = await query<Event>(
    `UPDATE events SET
      title = $1,
      description = $2,
      date_start = $3,
      date_end = $4,
      participation_type = $5,
      image_url = $6,
      link_url = $7,
      topic_id = $8,
      month = $9,
      year = $10,
      published = $11,
      privacy = $12,
      is_new = $13,
      new_set_at = ${newSetAtExpr},
      updated_at = NOW()
     WHERE id = $14
     RETURNING ${EVENT_COLS}`,
    [title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, published, privacy, newIsNew, id]
  );

  return c.json(rows[0]);
});

// DELETE /api/events/:id - 刪除活動
eventsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<Event>("SELECT * FROM events WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Event not found" }, 404);
  }

  await query("DELETE FROM events WHERE id = $1", [id]);
  return c.json({ success: true });
});
