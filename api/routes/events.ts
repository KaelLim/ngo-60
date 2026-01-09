import { Hono } from "hono";
import { query } from "../db.ts";

interface Event {
  id: number;
  title: string;
  date_start: string;
  date_end: string | null;
  tag: string | null;
  icon: string | null;
  month: number;
  year: number;
  image_url: string | null;
}

export const eventsRoutes = new Hono();

eventsRoutes.get("/", async (c) => {
  const month = c.req.query("month");
  const year = c.req.query("year");

  if (month && year) {
    const rows = await query<Event>(
      "SELECT * FROM events WHERE month = $1 AND year = $2 ORDER BY date_start",
      [parseInt(month), parseInt(year)]
    );
    return c.json(rows);
  }

  if (month) {
    const rows = await query<Event>(
      "SELECT * FROM events WHERE month = $1 ORDER BY date_start",
      [parseInt(month)]
    );
    return c.json(rows);
  }

  const rows = await query<Event>("SELECT * FROM events ORDER BY date_start");
  return c.json(rows);
});

eventsRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<Event>("SELECT * FROM events WHERE id = $1", [id]);
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
