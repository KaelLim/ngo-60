import { Hono } from "hono";
import { query } from "../db.ts";

interface Activity {
  id: number;
  title: string;
  date_label: string;
  location: string | null;
  month: number;
}

export const activitiesRoutes = new Hono();

activitiesRoutes.get("/", async (c) => {
  const month = c.req.query("month");

  if (month) {
    const rows = await query<Activity>(
      "SELECT * FROM activities WHERE month = $1 ORDER BY id",
      [parseInt(month)]
    );
    return c.json(rows);
  }

  const rows = await query<Activity>("SELECT * FROM activities ORDER BY month, id");
  return c.json(rows);
});

activitiesRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Activity>("SELECT * FROM activities WHERE id = $1", [id]);
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
