import { Hono } from "hono";
import { query } from "../db.ts";

interface ImpactSection {
  id: number;
  name: string;
  icon: string;
  stat_value: string | null;
  stat_label: string | null;
  sort_order: number;
}

export const impactRoutes = new Hono();

// GET /api/impact - 取得所有影響力區塊
impactRoutes.get("/", async (c) => {
  const rows = await query<ImpactSection>(
    "SELECT * FROM impact_sections ORDER BY sort_order"
  );
  return c.json(rows);
});

// GET /api/impact/:id - 取得單一影響力區塊
impactRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<ImpactSection>(
    "SELECT * FROM impact_sections WHERE id = $1",
    [id]
  );
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
