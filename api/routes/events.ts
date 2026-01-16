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
}

export const eventsRoutes = new Hono();

// GET /api/events - 取得活動列表
// 支援篩選: ?month=8&year=2026 或 ?topic_id=1
eventsRoutes.get("/", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");
  const topicId = c.req.query("topic_id");

  // 依主題篩選
  if (topicId) {
    const rows = await query<Event>(
      "SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start",
      [parseInt(topicId)]
    );
    return c.json(rows);
  }

  // 依月份和年份篩選
  if (month && year) {
    const rows = await query<Event>(
      "SELECT * FROM events WHERE month = $1 AND year = $2 ORDER BY date_start",
      [parseInt(month), parseInt(year)]
    );
    return c.json(rows);
  }

  // 僅依月份篩選
  if (month) {
    const rows = await query<Event>(
      "SELECT * FROM events WHERE month = $1 ORDER BY date_start",
      [parseInt(month)]
    );
    return c.json(rows);
  }

  // 取得所有活動
  const rows = await query<Event>("SELECT * FROM events ORDER BY date_start");
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
    sort_order = 0
  } = body;

  if (!title || !date_start || !month || !year) {
    return c.json({ error: "title, date_start, month, year are required" }, 400);
  }

  const rows = await query<Event>(
    `INSERT INTO events (title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [title, description || null, date_start, date_end || null, participation_type || null, image_url || null, link_url || null, topic_id || null, month, year, sort_order]
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
    sort_order = existing[0].sort_order
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
      sort_order = $11
     WHERE id = $12
     RETURNING *`,
    [title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order, id]
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
