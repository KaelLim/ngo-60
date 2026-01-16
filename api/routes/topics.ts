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
  participation_type: string | null;
  image_url: string | null;
  link_url: string | null;
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

// POST /api/topics - 新增主題
topicsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { name, subtitle, description, icon, background_image, sort_order = 0 } = body;

  if (!name || !icon) {
    return c.json({ error: "name, icon are required" }, 400);
  }

  const rows = await query<Topic>(
    `INSERT INTO topics (name, subtitle, description, icon, background_image, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, subtitle || null, description || null, icon, background_image || null, sort_order]
  );

  return c.json(rows[0], 201);
});

// PUT /api/topics/:id - 更新主題
topicsRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await query<Topic>("SELECT * FROM topics WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Topic not found" }, 404);
  }

  const {
    name = existing[0].name,
    subtitle = existing[0].subtitle,
    description = existing[0].description,
    icon = existing[0].icon,
    background_image = existing[0].background_image,
    sort_order = existing[0].sort_order
  } = body;

  const rows = await query<Topic>(
    `UPDATE topics SET name = $1, subtitle = $2, description = $3, icon = $4, background_image = $5, sort_order = $6
     WHERE id = $7 RETURNING *`,
    [name, subtitle, description, icon, background_image, sort_order, id]
  );

  return c.json(rows[0]);
});

// DELETE /api/topics/:id - 刪除主題
topicsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<Topic>("SELECT * FROM topics WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Topic not found" }, 404);
  }

  // 檢查是否有關聯的活動
  const relatedEvents = await query<Event>("SELECT id FROM events WHERE topic_id = $1", [id]);
  if (relatedEvents.length > 0) {
    return c.json({ error: "Cannot delete topic with related events", eventCount: relatedEvents.length }, 400);
  }

  await query("DELETE FROM topics WHERE id = $1", [id]);
  return c.json({ message: "Topic deleted", id: parseInt(id) });
});
