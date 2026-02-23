import { Hono } from "hono";
import { query } from "../db.ts";

interface ImpactConfig {
  id: number;
  main_title: string | null;
  subtitle: string | null;
  published: number;
  blessing_title: string | null;
  blessing_published: number;
  updated_at: string | null;
}

export const impactConfigRoutes = new Hono();

// GET /api/impact-config - 取得影響力設定
impactConfigRoutes.get("/", async (c) => {
  const rows = await query<ImpactConfig>(
    "SELECT * FROM impact_config WHERE id = 1"
  );
  return rows[0] ? c.json(rows[0]) : c.json({ id: 1, main_title: null, subtitle: null, published: 1, blessing_title: '傳送祝福 灌溉希望', blessing_published: 1 });
});

// PUT /api/impact-config - 更新影響力設定
impactConfigRoutes.put("/", async (c) => {
  const body = await c.req.json();

  const existing = await query<ImpactConfig>("SELECT * FROM impact_config WHERE id = 1");

  if (!existing[0]) {
    // Create if not exists
    const { main_title, subtitle, published = 1, blessing_title = '傳送祝福 灌溉希望', blessing_published = 1 } = body;
    const rows = await query<ImpactConfig>(
      `INSERT INTO impact_config (id, main_title, subtitle, published, blessing_title, blessing_published) VALUES (1, $1, $2, $3, $4, $5) RETURNING *`,
      [main_title || null, subtitle || null, published, blessing_title, blessing_published]
    );
    return c.json(rows[0], 201);
  }

  const {
    main_title = existing[0].main_title,
    subtitle = existing[0].subtitle,
    published = existing[0].published,
    blessing_title = existing[0].blessing_title,
    blessing_published = existing[0].blessing_published
  } = body;

  const rows = await query<ImpactConfig>(
    `UPDATE impact_config SET main_title = $1, subtitle = $2, published = $3, blessing_title = $4, blessing_published = $5, updated_at = now() WHERE id = 1 RETURNING *`,
    [main_title, subtitle, published, blessing_title, blessing_published]
  );

  return c.json(rows[0]);
});
