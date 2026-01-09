import { Hono } from "hono";
import { query } from "../db.ts";

interface Category {
  id: number;
  name: string;
  icon: string;
  type: string;
  sort_order: number;
}

export const categoriesRoutes = new Hono();

categoriesRoutes.get("/", async (c) => {
  const type = c.req.query("type");
  if (type) {
    const rows = await query<Category>(
      "SELECT * FROM categories WHERE type = $1 ORDER BY sort_order",
      [type]
    );
    return c.json(rows);
  }
  const rows = await query<Category>("SELECT * FROM categories ORDER BY sort_order");
  return c.json(rows);
});

categoriesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Category>("SELECT * FROM categories WHERE id = $1", [id]);
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
