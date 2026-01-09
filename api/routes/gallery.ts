import { Hono } from "hono";
import { query } from "../db.ts";

interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
  mime_type: string | null;
  uploaded_at: string;
  is_active: boolean;
}

export const galleryRoutes = new Hono();

// 取得所有圖片
galleryRoutes.get("/", async (c) => {
  const rows = await query<GalleryImage>(
    "SELECT * FROM gallery WHERE is_active = true ORDER BY uploaded_at DESC"
  );
  return c.json(rows);
});

// 隨機取得指定數量的圖片
galleryRoutes.get("/random", async (c) => {
  const count = parseInt(c.req.query("count") || "15");
  const rows = await query<GalleryImage>(
    "SELECT * FROM gallery WHERE is_active = true ORDER BY RANDOM() LIMIT $1",
    [count]
  );
  return c.json(rows);
});

// 上傳圖片
galleryRoutes.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // 驗證檔案類型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Allowed: jpeg, png, webp, gif" }, 400);
    }

    // 生成唯一檔名
    const ext = file.name.split(".").pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadPath = `./uploads/gallery/${filename}`;

    // 儲存檔案
    const arrayBuffer = await file.arrayBuffer();
    await Deno.writeFile(uploadPath, new Uint8Array(arrayBuffer));

    // 寫入資料庫
    const rows = await query<GalleryImage>(
      `INSERT INTO gallery (filename, original_name, mime_type)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [filename, file.name, file.type]
    );

    return c.json(rows[0], 201);
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// 刪除圖片 (軟刪除)
galleryRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<GalleryImage>(
    "UPDATE gallery SET is_active = false WHERE id = $1 RETURNING *",
    [id]
  );

  if (rows.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json({ message: "Deleted successfully" });
});

// 取得單張圖片資訊
galleryRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const rows = await query<GalleryImage>(
    "SELECT * FROM gallery WHERE id = $1 AND is_active = true",
    [id]
  );
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});
