import { Hono } from "hono";
import { query } from "../db.ts";

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
  topic_id: number;
  month: number;
  year: number;
}

export const topicsRoutes = new Hono();

// GET /api/topics - 取得所有主題
topicsRoutes.get("/", async (c) => {
  const rows = await query<Topic>(
    "SELECT * FROM topics ORDER BY sort_order"
  );
  return c.json(rows);
});

// GET /api/topics/:id - 取得單一主題詳情（含相關活動）
topicsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

  // 取得主題資訊
  const topicRows = await query<Topic>(
    "SELECT * FROM topics WHERE id = $1",
    [id]
  );

  if (!topicRows[0]) {
    return c.json({ error: "Topic not found" }, 404);
  }

  // 取得該主題的所有活動
  const eventRows = await query<Event>(
    "SELECT * FROM events WHERE topic_id = $1 ORDER BY date_start",
    [id]
  );

  return c.json({
    ...topicRows[0],
    events: eventRows
  });
});
