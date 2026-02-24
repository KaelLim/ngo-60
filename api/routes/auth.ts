import { Hono } from "hono";
import { sign, verify } from "jsr:@hono/hono@^4.6.0/jwt";
import { query } from "../db.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "tzuchi-60-jwt-secret-change-in-production";

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
}

export const authRoutes = new Hono();

// POST /api/auth/login
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const { username, password } = body;

  if (!username || !password) {
    return c.json({ error: "請輸入帳號和密碼" }, 400);
  }

  const users = await query<User>(
    "SELECT id, username, password_hash, role FROM users WHERE username = $1",
    [username]
  );

  if (users.length === 0) {
    return c.json({ error: "帳號或密碼錯誤" }, 401);
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return c.json({ error: "帳號或密碼錯誤" }, 401);
  }

  const token = await sign(
    { id: user.id, username: user.username, role: user.role, exp: Math.floor(Date.now() / 1000) + 86400 },
    JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// GET /api/auth/me
authRoutes.get("/me", async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "未授權" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, JWT_SECRET);
    return c.json({ user: { id: payload.id, username: payload.username, role: payload.role } });
  } catch {
    return c.json({ error: "Token 無效或已過期" }, 401);
  }
});

// Helper: verify token and return payload (used by other routes)
export async function verifyToken(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  try {
    return await verify(authHeader.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}
