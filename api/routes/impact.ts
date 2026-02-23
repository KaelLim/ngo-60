import { Hono } from "hono";
import { query } from "../db.ts";

interface ImpactSection {
  id: number;
  name: string;
  icon: string;
  stat_label: string | null;
  stat_value: string | null;
  stat_unit: string | null;
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

// POST /api/impact - 新增影響力區塊
impactRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { name, icon, stat_label, stat_value, stat_unit, sort_order = 0 } = body;

  if (!name || !icon) {
    return c.json({ error: "name, icon are required" }, 400);
  }

  const rows = await query<ImpactSection>(
    `INSERT INTO impact_sections (name, icon, stat_label, stat_value, stat_unit, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, icon, stat_label || null, stat_value || null, stat_unit || null, sort_order]
  );

  return c.json(rows[0], 201);
});

// PUT /api/impact/:id - 更新影響力區塊
impactRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await query<ImpactSection>("SELECT * FROM impact_sections WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Impact section not found" }, 404);
  }

  const {
    name = existing[0].name,
    icon = existing[0].icon,
    stat_label = existing[0].stat_label,
    stat_value = existing[0].stat_value,
    stat_unit = existing[0].stat_unit,
    sort_order = existing[0].sort_order
  } = body;

  const rows = await query<ImpactSection>(
    `UPDATE impact_sections SET name = $1, icon = $2, stat_label = $3, stat_value = $4, stat_unit = $5, sort_order = $6
     WHERE id = $7 RETURNING *`,
    [name, icon, stat_label, stat_value, stat_unit, sort_order, id]
  );

  return c.json(rows[0]);
});

// DELETE /api/impact/:id - 刪除影響力區塊
impactRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await query<ImpactSection>("SELECT * FROM impact_sections WHERE id = $1", [id]);
  if (!existing[0]) {
    return c.json({ error: "Impact section not found" }, 404);
  }

  await query("DELETE FROM impact_sections WHERE id = $1", [id]);
  return c.json({ message: "Impact section deleted", id: parseInt(id) });
});
