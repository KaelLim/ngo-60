import { Hono } from "jsr:@hono/hono@^4.6.0";
import { cors } from "jsr:@hono/hono@^4.6.0/cors";
import { serveStatic } from "jsr:@hono/hono@^4.6.0/deno";
import { bodyLimit } from "jsr:@hono/hono@^4.6.0/body-limit";
import { topicsRoutes } from "./routes/topics.ts";
import { eventsRoutes } from "./routes/events.ts";
import { impactRoutes } from "./routes/impact.ts";
import { impactConfigRoutes } from "./routes/impact-config.ts";
import { blessingsRoutes } from "./routes/blessings.ts";
import { galleryRoutes } from "./routes/gallery.ts";
import { homepageRoutes } from "./routes/homepage.ts";
import { blessingTagRoutes } from "./routes/blessing-tags.ts";
import { agentRoutes } from "./routes/agent.ts";

const app = new Hono();

// CORS middleware
app.use("/*", cors());

// Static files for uploaded images
app.use("/uploads/*", serveStatic({ root: "./" }));

// API Routes
app.route("/api/topics", topicsRoutes);
app.route("/api/events", eventsRoutes);
app.route("/api/impact", impactRoutes);
app.route("/api/impact-config", impactConfigRoutes);
app.route("/api/blessings", blessingsRoutes);
app.route("/api/blessing-tags", blessingTagRoutes);

// Gallery 路由 - 上傳大小限制 100MB
const galleryBodyLimit = bodyLimit({
  maxSize: 100 * 1024 * 1024,
  onError: (c) => c.json({ error: "檔案大小超過 100MB 限制" }, 413)
});
app.use("/api/gallery", galleryBodyLimit);
app.use("/api/gallery/*", galleryBodyLimit);
app.route("/api/gallery", galleryRoutes);
app.route("/api/homepage", homepageRoutes);

// AI Agent Routes
app.route("/api/agent", agentRoutes);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

console.log("Server running on http://localhost:8000");
Deno.serve({ port: 8000 }, app.fetch);
