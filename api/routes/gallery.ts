import { Hono } from "hono";
import { query } from "../db.ts";
// @deno-types="npm:@types/sharp"
import sharp from "npm:sharp";

// 圖片壓縮設定
const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,  // JPEG 品質 (1-100)
};

interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
  mime_type: string | null;
  category: string;
  uploaded_at: string;
  is_active: boolean;
}

export const galleryRoutes = new Hono();

// 取得所有圖片 (可依 category 篩選)
galleryRoutes.get("/", async (c) => {
  const category = c.req.query("category");

  if (category) {
    const rows = await query<GalleryImage>(
      "SELECT * FROM gallery WHERE is_active = true AND category = $1 ORDER BY uploaded_at DESC",
      [category]
    );
    return c.json(rows);
  }

  const rows = await query<GalleryImage>(
    "SELECT * FROM gallery WHERE is_active = true ORDER BY uploaded_at DESC"
  );
  return c.json(rows);
});

// 隨機取得指定數量的圖片 (可依 category 篩選)
galleryRoutes.get("/random", async (c) => {
  const count = parseInt(c.req.query("count") || "15");
  const category = c.req.query("category");

  if (category) {
    const rows = await query<GalleryImage>(
      "SELECT * FROM gallery WHERE is_active = true AND category = $1 ORDER BY RANDOM() LIMIT $2",
      [category, count]
    );
    return c.json(rows);
  }

  const rows = await query<GalleryImage>(
    "SELECT * FROM gallery WHERE is_active = true ORDER BY RANDOM() LIMIT $1",
    [count]
  );
  return c.json(rows);
});

// 上傳圖片 (可指定 category)
galleryRoutes.post("/", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null || "general";

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // 驗證檔案類型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Allowed: jpeg, png, webp, gif" }, 400);
    }

    // 生成唯一檔名 (統一輸出為 jpg)
    const filename = `${crypto.randomUUID()}.jpg`;
    const uploadPath = `./uploads/gallery/${filename}`;

    // 讀取原始檔案
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = new Uint8Array(arrayBuffer);

    // 使用 sharp 壓縮並調整尺寸
    // - 最大 1920x1080，保持比例
    // - 轉換為 JPEG，品質 85
    const processedBuffer = await sharp(inputBuffer)
      .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
        fit: 'inside',           // 保持比例，不超過指定尺寸
        withoutEnlargement: true // 小圖不放大
      })
      .jpeg({ quality: IMAGE_CONFIG.quality })
      .toBuffer();

    // 儲存壓縮後的檔案
    await Deno.writeFile(uploadPath, processedBuffer);

    // 寫入資料庫
    const rows = await query<GalleryImage>(
      `INSERT INTO gallery (filename, original_name, mime_type, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [filename, file.name, "image/jpeg", category]
    );

    return c.json(rows[0], 201);
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// 更新圖片資訊 (category)
galleryRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { category } = body;

  if (!category) {
    return c.json({ error: "Category is required" }, 400);
  }

  const rows = await query<GalleryImage>(
    "UPDATE gallery SET category = $1 WHERE id = $2 AND is_active = true RETURNING *",
    [category, id]
  );

  if (rows.length === 0) {
    return c.json({ error: "Not found" }, 404);
  }

  return c.json(rows[0]);
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
