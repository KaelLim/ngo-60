import { Hono } from "hono";
import { query } from "../db.ts";

interface ReportChapter {
  id: number;
  chapter_id: string;
  title: string;
  sort_order: number;
  updated_at: string;
}

interface ReportPage {
  id: number;
  chapter_id: string;
  page_id: string;
  title: string;
  content: string;
  sort_order: number;
  updated_at: string;
}

export const reportPagesRoutes = new Hono();

// ── Chapters ──

// 取得所有章節
reportPagesRoutes.get("/chapters", async (c) => {
  const rows = await query<ReportChapter>(
    "SELECT * FROM report_chapters ORDER BY sort_order"
  );
  return c.json(rows);
});

// 新增章節
reportPagesRoutes.post("/chapters", async (c) => {
  try {
    const { chapter_id, title } = await c.req.json();
    if (!chapter_id || !title) return c.json({ error: "需要 chapter_id 和 title" }, 400);
    const maxSort = await query<{ max: number }>(
      "SELECT COALESCE(MAX(sort_order), -1) as max FROM report_chapters"
    );
    const rows = await query<ReportChapter>(
      `INSERT INTO report_chapters (chapter_id, title, sort_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [chapter_id, title, (maxSort[0]?.max ?? -1) + 1]
    );
    return c.json(rows[0], 201);
  } catch (error) {
    console.error("Create chapter error:", error);
    return c.json({ error: "新增章節失敗" }, 500);
  }
});

// 更新章節
reportPagesRoutes.put("/chapters/:chapterId", async (c) => {
  try {
    const chapterId = c.req.param("chapterId");
    const { title, sort_order } = await c.req.json();
    const rows = await query<ReportChapter>(
      `UPDATE report_chapters SET
        title = COALESCE($1, title),
        sort_order = COALESCE($2, sort_order),
        updated_at = NOW()
       WHERE chapter_id = $3 RETURNING *`,
      [title, sort_order, chapterId]
    );
    if (rows.length === 0) return c.json({ error: "章節不存在" }, 404);
    return c.json(rows[0]);
  } catch (error) {
    console.error("Update chapter error:", error);
    return c.json({ error: "更新章節失敗" }, 500);
  }
});

// 刪除章節（同時刪除其下所有頁面）
reportPagesRoutes.delete("/chapters/:chapterId", async (c) => {
  try {
    const chapterId = c.req.param("chapterId");
    await query("DELETE FROM report_pages WHERE chapter_id = $1", [chapterId]);
    const rows = await query<ReportChapter>(
      "DELETE FROM report_chapters WHERE chapter_id = $1 RETURNING *",
      [chapterId]
    );
    if (rows.length === 0) return c.json({ error: "章節不存在" }, 404);
    return c.json({ message: "已刪除章節", chapter: rows[0] });
  } catch (error) {
    console.error("Delete chapter error:", error);
    return c.json({ error: "刪除章節失敗" }, 500);
  }
});

// ── Pages ──

// 取得所有頁面
reportPagesRoutes.get("/", async (c) => {
  const rows = await query<ReportPage>(
    "SELECT * FROM report_pages ORDER BY chapter_id, sort_order"
  );
  return c.json(rows);
});

// 取得某章節的所有頁面
reportPagesRoutes.get("/:chapterId", async (c) => {
  const chapterId = c.req.param("chapterId");
  // Skip if it matches "chapters" (handled above)
  if (chapterId === "chapters") return c.notFound();
  const rows = await query<ReportPage>(
    "SELECT * FROM report_pages WHERE chapter_id = $1 ORDER BY sort_order",
    [chapterId]
  );
  return c.json(rows);
});

// 取得單一頁面內容
reportPagesRoutes.get("/:chapterId/:pageId", async (c) => {
  const { chapterId, pageId } = c.req.param();
  const rows = await query<ReportPage>(
    "SELECT * FROM report_pages WHERE chapter_id = $1 AND page_id = $2",
    [chapterId, pageId]
  );
  return rows[0] ? c.json(rows[0]) : c.json({ error: "Not found" }, 404);
});

// 新增頁面
reportPagesRoutes.post("/:chapterId", async (c) => {
  try {
    const chapterId = c.req.param("chapterId");
    if (chapterId === "chapters") return c.notFound();

    const contentType = c.req.header("content-type") || "";
    let title: string;
    let pageId: string;
    let content = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      title = formData.get("title") as string;
      pageId = formData.get("page_id") as string;
      const file = formData.get("file") as File | null;
      if (file) content = await file.text();
    } else {
      const body = await c.req.json();
      title = body.title;
      pageId = body.page_id;
      content = body.content || "";
    }

    if (!pageId || !title) return c.json({ error: "需要 page_id 和 title" }, 400);

    const maxSort = await query<{ max: number }>(
      "SELECT COALESCE(MAX(sort_order), -1) as max FROM report_pages WHERE chapter_id = $1",
      [chapterId]
    );
    const rows = await query<ReportPage>(
      `INSERT INTO report_pages (chapter_id, page_id, title, content, sort_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [chapterId, pageId, title, content, (maxSort[0]?.max ?? -1) + 1]
    );
    return c.json(rows[0], 201);
  } catch (error) {
    console.error("Create page error:", error);
    return c.json({ error: "新增頁面失敗" }, 500);
  }
});

// 上傳/更新頁面內容
reportPagesRoutes.put("/:chapterId/:pageId", async (c) => {
  try {
    const { chapterId, pageId } = c.req.param();
    let content: string | undefined;
    let title: string | undefined;

    const contentType = c.req.header("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;
      if (file) content = await file.text();
      title = (formData.get("title") as string) || undefined;
    } else {
      const body = await c.req.json();
      content = body.content;
      title = body.title;
    }

    const existing = await query<ReportPage>(
      "SELECT id FROM report_pages WHERE chapter_id = $1 AND page_id = $2",
      [chapterId, pageId]
    );

    let rows: ReportPage[];
    if (existing.length > 0) {
      const sets: string[] = ["updated_at = NOW()"];
      const vals: unknown[] = [];
      let idx = 1;
      if (content !== undefined) { sets.push(`content = $${idx}`); vals.push(content); idx++; }
      if (title !== undefined) { sets.push(`title = $${idx}`); vals.push(title); idx++; }
      vals.push(chapterId, pageId);
      rows = await query<ReportPage>(
        `UPDATE report_pages SET ${sets.join(", ")}
         WHERE chapter_id = $${idx} AND page_id = $${idx + 1} RETURNING *`,
        vals
      );
    } else {
      rows = await query<ReportPage>(
        `INSERT INTO report_pages (chapter_id, page_id, title, content, sort_order)
         VALUES ($1, $2, $3, $4,
           (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM report_pages WHERE chapter_id = $1))
         RETURNING *`,
        [chapterId, pageId, title || pageId, content || ""]
      );
    }

    return c.json(rows[0]);
  } catch (error) {
    console.error("Update report page error:", error);
    return c.json({ error: "更新報告書頁面失敗" }, 500);
  }
});

// 刪除頁面
reportPagesRoutes.delete("/:chapterId/:pageId", async (c) => {
  try {
    const { chapterId, pageId } = c.req.param();
    const rows = await query<ReportPage>(
      "DELETE FROM report_pages WHERE chapter_id = $1 AND page_id = $2 RETURNING *",
      [chapterId, pageId]
    );
    if (rows.length === 0) return c.json({ error: "頁面不存在" }, 404);
    return c.json({ message: "已刪除頁面", page: rows[0] });
  } catch (error) {
    console.error("Delete report page error:", error);
    return c.json({ error: "刪除報告書頁面失敗" }, 500);
  }
});
