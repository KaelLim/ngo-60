import { Hono } from "hono";
import { query } from "../db.ts";
import { verifyToken } from "./auth.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

interface User {
  id: number;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export const usersRoutes = new Hono();

// Middleware: require admin
async function requireAdmin(c: any, next: any) {
  const payload = await verifyToken(c.req.header("Authorization"));
  if (!payload) {
    return c.json({ error: "未授權" }, 401);
  }
  if (payload.role !== "admin") {
    return c.json({ error: "權限不足" }, 403);
  }
  c.set("user", payload);
  await next();
}

usersRoutes.use("/*", requireAdmin);

// GET /api/users
usersRoutes.get("/", async (c) => {
  const users = await query<Omit<User, "password_hash">>(
    "SELECT id, username, role, created_at FROM users ORDER BY id"
  );
  return c.json(users);
});

// POST /api/users
usersRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const { username, password, role } = body;

  if (!username || !password) {
    return c.json({ error: "請輸入帳號和密碼" }, 400);
  }

  const hash = await bcrypt.hash(password);

  try {
    const result = await query<User>(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at",
      [username, hash, role || "admin"]
    );
    return c.json(result[0], 201);
  } catch (e: any) {
    if (e.message?.includes("unique") || e.message?.includes("duplicate")) {
      return c.json({ error: "帳號已存在" }, 409);
    }
    throw e;
  }
});

// PUT /api/users/:id
usersRoutes.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();
  const { username, password, role } = body;

  if (!username) {
    return c.json({ error: "請輸入帳號" }, 400);
  }

  if (password) {
    const hash = await bcrypt.hash(password);
    try {
      const result = await query<User>(
        "UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4 RETURNING id, username, role, created_at",
        [username, hash, role || "admin", id]
      );
      if (result.length === 0) return c.json({ error: "使用者不存在" }, 404);
      return c.json(result[0]);
    } catch (e: any) {
      if (e.message?.includes("unique") || e.message?.includes("duplicate")) {
        return c.json({ error: "帳號已存在" }, 409);
      }
      throw e;
    }
  } else {
    try {
      const result = await query<User>(
        "UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role, created_at",
        [username, role || "admin", id]
      );
      if (result.length === 0) return c.json({ error: "使用者不存在" }, 404);
      return c.json(result[0]);
    } catch (e: any) {
      if (e.message?.includes("unique") || e.message?.includes("duplicate")) {
        return c.json({ error: "帳號已存在" }, 409);
      }
      throw e;
    }
  }
});

// DELETE /api/users/:id
usersRoutes.delete("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const currentUser = c.get("user");

  if (currentUser.id === id) {
    return c.json({ error: "無法刪除自己的帳號" }, 400);
  }

  await query("DELETE FROM users WHERE id = $1", [id]);
  return c.json({ success: true });
});
