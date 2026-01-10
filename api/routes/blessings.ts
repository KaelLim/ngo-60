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
