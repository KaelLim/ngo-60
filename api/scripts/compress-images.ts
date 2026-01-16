// 壓縮現有圖片的腳本
// 執行方式：deno run --allow-read --allow-write --allow-env --allow-net scripts/compress-images.ts

import { Jimp } from "npm:jimp@1.6.0";
import { query } from "../db.ts";

const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
};

interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
}

async function compressExistingImages() {
  console.log("開始壓縮現有圖片...\n");

  // 取得所有圖片
  const images = await query<GalleryImage>(
    "SELECT id, filename, original_name FROM gallery WHERE is_active = true"
  );

  console.log(`找到 ${images.length} 張圖片\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const img of images) {
    const filePath = `./uploads/gallery/${img.filename}`;

    try {
      // 檢查檔案是否存在
      const stat = await Deno.stat(filePath);
      const originalSize = stat.size;

      // 讀取並處理圖片
      const imageData = await Deno.readFile(filePath);
      const image = await Jimp.read(Buffer.from(imageData));

      // 如果圖片超過最大尺寸，則縮小
      const needsResize = image.width > IMAGE_CONFIG.maxWidth || image.height > IMAGE_CONFIG.maxHeight;

      if (needsResize) {
        image.scaleToFit({ w: IMAGE_CONFIG.maxWidth, h: IMAGE_CONFIG.maxHeight });
      }

      // 轉換為 JPEG 並壓縮
      const processedBuffer = await image
        .quality(IMAGE_CONFIG.quality)
        .getBuffer("image/jpeg");

      // 產生新檔名 (如果原本不是 .jpg)
      let newFilename = img.filename;
      if (!img.filename.endsWith('.jpg')) {
        newFilename = img.filename.replace(/\.[^.]+$/, '.jpg');
        // 刪除舊檔案
        await Deno.remove(filePath).catch(() => {});
      }

      const newFilePath = `./uploads/gallery/${newFilename}`;
      await Deno.writeFile(newFilePath, processedBuffer);

      // 更新資料庫檔名
      if (newFilename !== img.filename) {
        await query(
          "UPDATE gallery SET filename = $1, mime_type = 'image/jpeg' WHERE id = $2",
          [newFilename, img.id]
        );
      }

      const newSize = processedBuffer.length;
      const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

      console.log(`✓ ${img.filename} → ${newFilename}`);
      console.log(`  原始: ${(originalSize / 1024).toFixed(0)} KB → 壓縮後: ${(newSize / 1024).toFixed(0)} KB (減少 ${reduction}%)`);
      if (needsResize) {
        console.log(`  尺寸已調整為 ${image.width}x${image.height}`);
      }
      console.log("");

      processed++;
    } catch (e) {
      console.error(`✗ ${img.filename}: ${e.message}`);
      errors++;
    }
  }

  console.log("\n========== 完成 ==========");
  console.log(`處理成功: ${processed}`);
  console.log(`錯誤: ${errors}`);
}

// 執行
compressExistingImages()
  .then(() => Deno.exit(0))
  .catch((e) => {
    console.error("執行失敗:", e);
    Deno.exit(1);
  });
