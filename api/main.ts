import { Hono } from "jsr:@hono/hono@^4.6.0";
import { cors } from "jsr:@hono/hono@^4.6.0/cors";
import { serveStatic } from "jsr:@hono/hono@^4.6.0/deno";
import { categoriesRoutes } from "./routes/categories.ts";
import { eventsRoutes } from "./routes/events.ts";
import { newsRoutes } from "./routes/news.ts";
import { activitiesRoutes } from "./routes/activities.ts";
import { galleryRoutes } from "./routes/gallery.ts";
import { homepageRoutes } from "./routes/homepage.ts";

const app = new Hono();

// CORS middleware
app.use("/*", cors());

// Static files for uploaded images
app.use("/uploads/*", serveStatic({ root: "./" }));

// Routes
app.route("/api/categories", categoriesRoutes);
app.route("/api/events", eventsRoutes);
app.route("/api/news", newsRoutes);
app.route("/api/activities", activitiesRoutes);
app.route("/api/gallery", galleryRoutes);
app.route("/api/homepage", homepageRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

console.log("Server running on http://localhost:8000");
Deno.serve({ port: 8000 }, app.fetch);
