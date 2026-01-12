import { Hono } from "hono";
import { query } from "../db.ts";

interface Blessing {
  id: number;
  author: string;
  message: string;
  full_content: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

export const blessingsRoutes = new Hono();

// GET /api/blessings - 取得所有祝福語
// 支援篩選: ?featured=true (僅取得精選)
blessingsRoutes.get("/", async (c) => {
  const featured = c.req.query("featured");

  if (featured === "true") {
    const rows = await query<Blessing>(
      "SELECT * FROM blessings WHERE is_featured = true ORDER BY sort_order"
    );
    return c.json(rows);
  }

  const rows = await query<Blessing>(
    "SELECT * FROM blessings ORDER BY sort_order"
  );
  return c.json(rows);
});

// GET /api/blessings/:id - 取得單一祝福語詳情
blessingsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Blessing>(
    "SELECT * FROM blessings WHERE id = $1",
    [id]
  );
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});

// POST /api/blessings - 新增祝福語
blessingsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { author, message, full_content, image_url, is_featured = false, sort_order = 0 } = body;

  if (!author || !message) {
    return c.json({ error: "author, message are required" }, 400);
  }

  const rows = await query<Blessing>(
    `INSERT INTO blessings (author, message, full_content, image_url, is_featured, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [author, message, full_content || null, image_url || null, is_featured, sort_order]
  );

  return c.json(rows[0], 201);
});

// PUT /api/blessings/:id - 更新祝福語
blessingsRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await query<Blessing>("SELECT * FROM blessings WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Blessing not found" }, 404);
  }

  const {
    author = existing[0].author,
    message = existing[0].message,
    full_content = existing[0].full_content,
    image_url = existing[0].image_url,
    is_featured = existing[0].is_featured,
    sort_order = existing[0].sort_order
  } = body;

  const rows = await query<Blessing>(
    `UPDATE blessings SET author = $1, message = $2, full_content = $3, image_url = $4, is_featured = $5, sort_order = $6
     WHERE id = $7 RETURNING *`,
    [author, message, full_content, image_url, is_featured, sort_order, id]
  );

  return c.json(rows[0]);
});

// DELETE /api/blessings/:id - 刪除祝福語
blessingsRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<Blessing>("SELECT * FROM blessings WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Blessing not found" }, 404);
  }

  await query("DELETE FROM blessings WHERE id = $1", [id]);
  return c.json({ message: "Blessing deleted", id: parseInt(id) });
});
