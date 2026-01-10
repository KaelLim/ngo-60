import { Hono } from "hono";
import { query } from "../db.ts";

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
