import { Hono } from "hono";
import { query } from "../db.ts";

interface News {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  icon: string | null;
  category_id: number | null;
  published_at: string;
  image_url: string | null;
}

export const newsRoutes = new Hono();

newsRoutes.get("/", async (c) => {
  const categoryId = c.req.query("category_id");

  if (categoryId) {
    const rows = await query<News>(
      "SELECT * FROM news WHERE category_id = $1 ORDER BY published_at DESC",
      [parseInt(categoryId)]
    );
    return c.json(rows);
  }

  const rows = await query<News>("SELECT * FROM news ORDER BY published_at DESC");
  return c.json(rows);
});

newsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<News>("SELECT * FROM news WHERE id = $1", [id]);
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
