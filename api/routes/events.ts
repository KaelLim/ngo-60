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
  sort_order: number;
  published: boolean;
}

export const eventsRoutes = new Hono();

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
      `SELECT * FROM events WHERE topic_id = $1 ${publishedCondition} ORDER BY date_start`,
      [parseInt(topicId)]
    );
    return c.json(rows);
  }

  // 依月份和年份篩選 (使用日期範圍邏輯)
  // 活動會顯示在該月份，如果：
  // - date_start <= 該月最後一天 AND
  // - (date_end >= 該月第一天 OR date_end IS NULL 且 date_start 在該月內)
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    // 該月第一天
    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
    // 該月最後一天 (下個月第一天減一天)
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const rows = await query<Event>(
      `SELECT * FROM events
       WHERE date_start < $2::date
         AND (
           date_end >= $1::date
           OR (date_end IS NULL AND date_start >= $1::date AND date_start < $2::date)
         )
         ${publishedCondition}
       ORDER BY date_start`,
      [monthStart, monthEnd]
    );
    return c.json(rows);
  }

  // 僅依月份篩選 (假設當年)
  if (month) {
    const m = parseInt(month);
    const y = new Date().getFullYear();
    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

    const rows = await query<Event>(
      `SELECT * FROM events
       WHERE date_start < $2::date
         AND (
           date_end >= $1::date
           OR (date_end IS NULL AND date_start >= $1::date AND date_start < $2::date)
         )
         ${publishedCondition}
       ORDER BY date_start`,
      [monthStart, monthEnd]
    );
    return c.json(rows);
  }

  // 取得所有活動
  const rows = await query<Event>(
    showAll
      ? "SELECT * FROM events ORDER BY date_start"
      : "SELECT * FROM events WHERE published = true ORDER BY date_start"
  );
  return c.json(rows);
});

// GET /api/events/:id - 取得單一活動詳情
eventsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Event>("SELECT * FROM events WHERE id = $1", [id]);
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
    sort_order = 0,
    published = true
  } = body;

  if (!title || !date_start || !month || !year) {
    return c.json({ error: "title, date_start, month, year are required" }, 400);
  }

  const rows = await query<Event>(
    `INSERT INTO events (title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order, published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [title, description || null, date_start, date_end || null, participation_type || null, image_url || null, link_url || null, topic_id || null, month, year, sort_order, published]
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
    sort_order = existing[0].sort_order,
    published = existing[0].published
  } = body;

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
      sort_order = $11,
      published = $12
     WHERE id = $13
     RETURNING *`,
    [title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order, published, id]
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
  return c.json({ message: "Event deleted", id: parseInt(id) });
});
