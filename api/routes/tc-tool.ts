import { Hono } from "hono";

const TC_API_BASE = Deno.env.get("TC_API_BASE") || "https://tcapipublic.tcstorege.synology.me/tool";

export const tcToolRoutes = new Hono();

// Proxy: GET /api/tc-tool/youtube/fetch/playlist/:playlistId
tcToolRoutes.get("/youtube/fetch/playlist/:playlistId", async (c) => {
  const { playlistId } = c.req.param();
  try {
    const res = await fetch(`${TC_API_BASE}/youtube/fetch/playlist/${playlistId}`);
    if (!res.ok) {
      return c.json({ error: "Failed to fetch playlist" }, res.status);
    }
    const data = await res.json();
    return c.json(data);
  } catch (e) {
    console.error("TC Tool proxy error:", e);
    return c.json({ error: "Failed to fetch playlist" }, 502);
  }
});
