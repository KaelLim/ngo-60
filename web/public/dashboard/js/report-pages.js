import { api } from './api.js';
import { showToast } from './toast.js';

let chaptersData = [];
let pagesData = [];
let activeChapterId = null;
let editorChapterId = null;
let editorPageId = null;

// ── Load ──

export async function loadReportPages() {
  // Close editor if open
  if (editorChapterId) {
    closeReportEditor();
  }
  try {
    chaptersData = await api.getReportChapters();
    renderChapterTabs();
    if (chaptersData.length > 0) {
      if (!activeChapterId || !chaptersData.find(c => c.chapter_id === activeChapterId)) {
        activeChapterId = chaptersData[0].chapter_id;
      }
      await loadChapterPages(activeChapterId);
    } else {
      activeChapterId = null;
      pagesData = [];
      document.getElementById('report-pages-card').style.display = 'none';
      document.getElementById('report-empty-state').style.display = 'block';
    }
  } catch (err) {
    console.error('Load report error:', err);
  }
}

async function loadChapterPages(chapterId) {
  activeChapterId = chapterId;
  try {
    pagesData = await api.getReportPagesByChapter(chapterId);
  } catch {
    pagesData = [];
  }
  renderChapterTabs();
  renderPagesTable();
}

// ── Render Tabs ──

function renderChapterTabs() {
  const container = document.getElementById('report-tabs');
  if (!container) return;

  if (chaptersData.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = chaptersData.map(ch => `
    <button class="report-tab ${ch.chapter_id === activeChapterId ? 'active' : ''}"
            onclick="selectReportChapter('${ch.chapter_id}')">
      ${ch.title}
    </button>
  `).join('');
}

// ── Render Pages ──

function renderPagesTable() {
  const card = document.getElementById('report-pages-card');
  const empty = document.getElementById('report-empty-state');
  const tbody = document.getElementById('report-pages-table');
  const titleEl = document.getElementById('report-active-chapter-title');

  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  if (!chapter) {
    card.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  card.style.display = 'block';
  empty.style.display = 'none';
  titleEl.textContent = chapter.title;

  if (pagesData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#71717a;padding:32px">
      尚無頁面，點擊「+ 新增頁面」開始新增
    </td></tr>`;
    return;
  }

  tbody.innerHTML = pagesData.map(pg => {
    const hasContent = pg.content && pg.content.trim().length > 0;
    const updatedAt = pg.updated_at ? new Date(pg.updated_at).toLocaleDateString('zh-TW') : '-';
    return `
      <tr>
        <td>
          <div style="font-weight:500">${escapeHtml(pg.title)}</div>
          <div style="font-size:12px;color:#71717a">${escapeHtml(pg.page_id)}</div>
        </td>
        <td style="text-align:center">
          ${hasContent
            ? '<span class="badge badge-success">已上傳</span>'
            : '<span class="badge badge-muted">未上傳</span>'}
        </td>
        <td style="text-align:center;font-size:13px;color:#a1a1aa">${updatedAt}</td>
        <td style="text-align:center">
          <label class="btn btn-sm btn-primary" style="cursor:pointer">
            <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle">upload_file</span>
            上傳
            <input type="file" accept=".md,.markdown,.txt" style="display:none"
              onchange="handleReportUpload('${pg.chapter_id}', '${pg.page_id}', this)">
          </label>
          <button class="btn btn-sm btn-primary" onclick="editReportPage('${pg.chapter_id}', '${pg.page_id}')">
            <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle">edit</span>
            編輯
          </button>
          ${hasContent ? `
            <button class="btn btn-sm btn-secondary" onclick="downloadReportPageMd('${pg.chapter_id}', '${pg.page_id}', '${escapeHtml(pg.title)}')">
              <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle">download</span>
            </button>
          ` : ''}
          <button class="btn btn-sm btn-danger" onclick="deleteReportPage('${pg.chapter_id}', '${pg.page_id}')">
            <span class="material-symbols-outlined" style="font-size:15px;vertical-align:middle">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Chapter CRUD ──

window.selectReportChapter = function(chapterId) {
  loadChapterPages(chapterId);
};

window.openReportChapterModal = function(chapter = null) {
  document.getElementById('report-chapter-modal-title').textContent = chapter ? '編輯章節' : '新增章節';
  document.getElementById('report-chapter-edit-id').value = chapter?.chapter_id || '';
  document.getElementById('report-chapter-slug').value = chapter?.chapter_id || '';
  document.getElementById('report-chapter-slug').disabled = !!chapter;
  document.getElementById('report-chapter-title').value = chapter?.title || '';
  document.getElementById('report-chapter-modal').classList.add('active');
};

window.closeReportChapterModal = function() {
  document.getElementById('report-chapter-modal').classList.remove('active');
};

window.editReportChapter = function() {
  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  if (chapter) openReportChapterModal(chapter);
};

window.deleteReportChapter = async function() {
  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  if (!chapter) return;
  if (!confirm(`確定要刪除「${chapter.title}」章節及其所有頁面嗎？此操作無法復原。`)) return;
  try {
    await api.deleteReportChapter(activeChapterId);
    showToast('已刪除章節', 'success');
    activeChapterId = null;
    await loadReportPages();
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

// ── Page CRUD ──

window.openReportPageModal = function(page = null) {
  document.getElementById('report-page-modal-title').textContent = page ? '編輯頁面' : '新增頁面';
  document.getElementById('report-page-edit-id').value = page?.page_id || '';
  document.getElementById('report-page-slug').value = page?.page_id || '';
  document.getElementById('report-page-slug').disabled = !!page;
  document.getElementById('report-page-title').value = page?.title || '';
  document.getElementById('report-page-file').value = '';
  document.getElementById('report-page-modal').classList.add('active');
};

window.closeReportPageModal = function() {
  document.getElementById('report-page-modal').classList.remove('active');
};

window.editReportPage = async function(chapterId, pageId) {
  const page = pagesData.find(p => p.chapter_id === chapterId && p.page_id === pageId);
  if (!page) return;

  editorChapterId = chapterId;
  editorPageId = pageId;

  // Fetch full content
  let content = page.content || '';
  try {
    const data = await api.getReportPage(chapterId, pageId);
    content = data.content || '';
  } catch { /* use existing */ }

  // Show editor, hide pages table + tabs
  document.getElementById('report-pages-card').style.display = 'none';
  document.getElementById('report-tabs').style.display = 'none';
  document.getElementById('report-editor-card').style.display = 'block';

  // Show breadcrumb: chapter > page
  const chapter = chaptersData.find(c => c.chapter_id === chapterId);
  document.getElementById('report-editor-title').textContent =
    (chapter ? chapter.title + ' / ' : '') + page.title;

  const textarea = document.getElementById('report-editor-textarea');
  textarea.value = content;
  updateReportPreview();
  textarea.focus();

  // Upload handler
  const uploadInput = document.getElementById('report-editor-upload');
  uploadInput.onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    const text = await file.text();
    textarea.value = text;
    updateReportPreview();
    showToast('已載入檔案內容', 'success');
    this.value = '';
  };
};

window.deleteReportPage = async function(chapterId, pageId) {
  const page = pagesData.find(p => p.chapter_id === chapterId && p.page_id === pageId);
  if (!confirm(`確定要刪除「${page?.title || pageId}」頁面嗎？`)) return;
  try {
    await api.deleteReportPage(chapterId, pageId);
    showToast('已刪除頁面', 'success');
    await loadChapterPages(activeChapterId);
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

window.handleReportUpload = async function(chapterId, pageId, input) {
  const file = input.files[0];
  if (!file) return;
  try {
    await api.uploadReportPage(chapterId, pageId, file);
    showToast('上傳成功！', 'success');
    await loadChapterPages(activeChapterId);
  } catch (err) {
    showToast('上傳失敗：' + err.message, 'error');
  }
  input.value = '';
};

window.previewReportPage = async function(chapterId, pageId) {
  const modal = document.getElementById('report-preview-modal');
  const contentEl = document.getElementById('report-preview-content');
  if (!modal || !contentEl) return;
  contentEl.innerHTML = '<p style="text-align:center;color:#a1a1aa;padding:20px">載入中...</p>';
  modal.classList.add('active');
  try {
    const data = await api.getReportPage(chapterId, pageId);
    contentEl.innerHTML = `<pre style="white-space:pre-wrap;word-break:break-word;font-family:'Noto Sans TC',sans-serif;font-size:14px;line-height:1.8;color:#e4e4e7;background:#18181b;padding:20px;border-radius:8px;max-height:60vh;overflow-y:auto">${escapeHtml(data.content)}</pre>`;
  } catch {
    contentEl.innerHTML = '<p style="color:#ef4444">載入失敗</p>';
  }
};

window.closeReportPreview = function() {
  document.getElementById('report-preview-modal').classList.remove('active');
};

window.downloadReportPageMd = async function(chapterId, pageId, title) {
  try {
    const data = await api.getReportPage(chapterId, pageId);
    const blob = new Blob([data.content || ''], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showToast('下載失敗：' + err.message, 'error');
  }
};

// ── Editor Functions ──

window.closeReportEditor = function() {
  document.getElementById('report-editor-card').style.display = 'none';
  document.getElementById('report-pages-card').style.display = 'block';
  document.getElementById('report-tabs').style.display = '';
  editorChapterId = null;
  editorPageId = null;
};

window.saveReportEditor = async function() {
  if (!editorChapterId || !editorPageId) return;
  const content = document.getElementById('report-editor-textarea').value;
  try {
    await api.updateReportPageContent(editorChapterId, editorPageId, content);
    showToast('儲存成功！', 'success');
    await loadChapterPages(activeChapterId);
  } catch (err) {
    showToast('儲存失敗：' + err.message, 'error');
  }
};

window.downloadReportMd = function() {
  const content = document.getElementById('report-editor-textarea').value;
  const title = document.getElementById('report-editor-title').textContent || 'report';
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${editorPageId || title}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

window.updateReportPreview = function() {
  const content = document.getElementById('report-editor-textarea').value;
  const preview = document.getElementById('report-editor-preview');
  if (typeof marked !== 'undefined') {
    preview.innerHTML = marked.parse(content || '');
  } else {
    preview.textContent = content;
  }
};

window.insertMd = function(type) {
  const textarea = document.getElementById('report-editor-textarea');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  let insert = '';
  let cursorOffset = 0;

  switch (type) {
    case 'bold':
      insert = `**${selected || '粗體文字'}**`;
      cursorOffset = selected ? insert.length : 2;
      break;
    case 'italic':
      insert = `*${selected || '斜體文字'}*`;
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'h1':
      insert = `# ${selected || '標題'}`;
      cursorOffset = insert.length;
      break;
    case 'h2':
      insert = `## ${selected || '標題'}`;
      cursorOffset = insert.length;
      break;
    case 'h3':
      insert = `### ${selected || '標題'}`;
      cursorOffset = insert.length;
      break;
    case 'ul':
      insert = `- ${selected || '項目'}`;
      cursorOffset = insert.length;
      break;
    case 'ol':
      insert = `1. ${selected || '項目'}`;
      cursorOffset = insert.length;
      break;
    case 'link':
      insert = `[${selected || '連結文字'}](https://)`;
      cursorOffset = insert.length - 1;
      break;
    case 'image':
      insert = `![${selected || '圖片描述'}](https://)`;
      cursorOffset = insert.length - 1;
      break;
    case 'quote':
      insert = `> ${selected || '引用文字'}`;
      cursorOffset = insert.length;
      break;
    case 'code':
      insert = selected.includes('\n')
        ? `\`\`\`\n${selected || '程式碼'}\n\`\`\``
        : `\`${selected || '程式碼'}\``;
      cursorOffset = insert.length;
      break;
    case 'hr':
      insert = '\n---\n';
      cursorOffset = insert.length;
      break;
  }

  textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
  textarea.focus();
  updateReportPreview();
};

window.uploadEditorImage = async function(input) {
  const file = input.files[0];
  if (!file) return;

  const textarea = document.getElementById('report-editor-textarea');
  const start = textarea.selectionStart;

  // Show uploading placeholder
  const placeholder = `![上傳中...](uploading)`;
  textarea.value = textarea.value.substring(0, start) + placeholder + textarea.value.substring(start);
  updateReportPreview();

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', 'report');

    const token = localStorage.getItem('token');
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    if (!res.ok) throw new Error('上傳失敗');
    const data = await res.json();

    const imageUrl = `/uploads/gallery/${data.filename}`;
    const imageMd = `![${file.name}](${imageUrl})`;

    // Replace placeholder with actual image
    textarea.value = textarea.value.replace(placeholder, imageMd);
    updateReportPreview();
    showToast('圖片上傳成功！', 'success');
  } catch (err) {
    // Remove placeholder on error
    textarea.value = textarea.value.replace(placeholder, '');
    updateReportPreview();
    showToast('圖片上傳失敗：' + err.message, 'error');
  }

  input.value = '';
};

// ── Form Handlers ──

function initChapterForm() {
  document.getElementById('report-chapter-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('report-chapter-edit-id').value;
    const slug = document.getElementById('report-chapter-slug').value.trim();
    const title = document.getElementById('report-chapter-title').value.trim();

    try {
      if (editId) {
        await api.updateReportChapter(editId, { title });
        showToast('章節已更新', 'success');
      } else {
        await api.createReportChapter({ chapter_id: slug, title });
        showToast('章節已新增', 'success');
        activeChapterId = slug;
      }
      closeReportChapterModal();
      await loadReportPages();
    } catch (err) {
      showToast('儲存失敗：' + err.message, 'error');
    }
  });
}

function initPageForm() {
  document.getElementById('report-page-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('report-page-edit-id').value;
    const slug = document.getElementById('report-page-slug').value.trim();
    const title = document.getElementById('report-page-title').value.trim();
    const fileInput = document.getElementById('report-page-file');
    const file = fileInput.files[0];

    try {
      if (editId) {
        // Update title
        await api.updateReportPageTitle(activeChapterId, editId, title);
        // Upload file if provided
        if (file) {
          await api.uploadReportPage(activeChapterId, editId, file);
        }
        showToast('頁面已更新', 'success');
      } else {
        // Create page
        if (file) {
          // Create with file
          const formData = new FormData();
          formData.append('page_id', slug);
          formData.append('title', title);
          formData.append('file', file);
          // Use raw fetch since api.createReportPage sends JSON
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/report-pages/${activeChapterId}`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
          });
          if (!res.ok) throw new Error('新增失敗');
        } else {
          await api.createReportPage(activeChapterId, { page_id: slug, title });
        }
        showToast('頁面已新增', 'success');
      }
      closeReportPageModal();
      await loadChapterPages(activeChapterId);
    } catch (err) {
      showToast('儲存失敗：' + err.message, 'error');
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

export function initReportPages() {
  initChapterForm();
  initPageForm();
}
