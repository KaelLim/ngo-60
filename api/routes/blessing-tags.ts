import { Hono } from "hono";
import { query } from "../db.ts";

interface BlessingTag {
  id: number;
  message: string;
  is_active: boolean;
}

export const blessingTagRoutes = new Hono();

// GET /api/blessing-tags - 取得所有祝福語標籤 (隨機排序)
blessingTagRoutes.get("/", async (c) => {
  const rows = await query<BlessingTag>(
    "SELECT * FROM blessing_tags WHERE is_active = true ORDER BY RANDOM()"
  );
  return c.json(rows);
});

// POST /api/blessing-tags - 新增祝福語標籤
blessingTagRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { message } = body;

  if (!message) {
    return c.json({ error: "message is required" }, 400);
  }

  const rows = await query<BlessingTag>(
    `INSERT INTO blessing_tags (message) VALUES ($1) RETURNING *`,
    [message]
  );

  return c.json(rows[0], 201);
});

// DELETE /api/blessing-tags/:id - 刪除祝福語標籤
blessingTagRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<BlessingTag>("SELECT * FROM blessing_tags WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Blessing tag not found" }, 404);
  }

  await query("DELETE FROM blessing_tags WHERE id = $1", [id]);
  return c.json({ message: "Blessing tag deleted", id: parseInt(id) });
});
