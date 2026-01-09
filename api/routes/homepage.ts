import { Hono } from "hono";
import { query } from "../db.ts";

interface Homepage {
  id: number;
  slogan: string | null;
  title: string | null;
  content: string | null;
  updated_at: string;
}

export const homepageRoutes = new Hono();

// 取得首頁內容
homepageRoutes.get("/", async (c) => {
  const rows = await query<Homepage>(
    "SELECT * FROM homepage ORDER BY id LIMIT 1"
  );
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});

// 更新首頁內容
homepageRoutes.put("/", async (c) => {
  try {
    const body = await c.req.json();
    const { slogan, title, content } = body;

    // 檢查是否已有資料
    const existing = await query<Homepage>("SELECT id FROM homepage LIMIT 1");

    let rows: Homepage[];
    if (existing.length > 0) {
      // 更新現有資料
      rows = await query<Homepage>(
        `UPDATE homepage
         SET slogan = COALESCE($1, slogan),
             title = COALESCE($2, title),
             content = COALESCE($3, content),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [slogan, title, content, existing[0].id]
      );
    } else {
      // 建立新資料
      rows = await query<Homepage>(
        `INSERT INTO homepage (slogan, title, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [slogan, title, content]
      );
    }

    return c.json(rows[0]);
  } catch (error) {
    console.error("Update homepage error:", error);
    return c.json({ error: "Failed to update homepage" }, 500);
  }
});
