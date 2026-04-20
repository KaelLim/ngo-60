import { api } from './api.js';
import { showToast } from './toast.js';

let chaptersData = [];
let activeChapterId = null;
let chapterDocxFile = null;

// ── Report Image Picker State ──
let reportPickerGallery = [];
let reportPickerSelectedId = null;

// ── Load ──

export async function loadReportPages() {
  destroyEditor();
  try {
    chaptersData = await api.getReportChapters();
    if (chaptersData.length > 0) {
      if (!activeChapterId || !chaptersData.find(c => c.chapter_id === activeChapterId)) {
        activeChapterId = chaptersData[0].chapter_id;
      }
      renderTabs();
      await loadChapterEditor(activeChapterId);
    } else {
      activeChapterId = null;
      renderTabs();
      document.getElementById('report-editor-card').style.display = 'none';
      document.getElementById('report-chapter-actions').style.display = 'none';
      document.getElementById('report-empty-state').style.display = 'block';
    }
  } catch (err) {
    console.error('Load report error:', err);
  }
}

// ── Render Tabs ──

function renderTabs() {
  const container = document.getElementById('report-tabs');
  if (!container) return;
  container.innerHTML = chaptersData.map(ch => `
    <button class="report-tab ${ch.chapter_id === activeChapterId ? 'active' : ''}"
            onclick="selectReportChapter('${ch.chapter_id}')">
      ${ch.title}
    </button>
  `).join('');
}

// ── Select Chapter → Load Editor ──

let isEditorLoading = false;

window.selectReportChapter = async function(chapterId) {
  if (isEditorLoading) return; // Prevent switching while loading
  if (chapterId === activeChapterId && tinymce.get('report-tinymce-editor')) return;
  activeChapterId = chapterId;
  renderTabs();
  await loadChapterEditor(chapterId);
};

function showEditorLoading(show) {
  const overlay = document.getElementById('report-editor-loading');
  if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

async function loadChapterEditor(chapterId) {
  const chapter = chaptersData.find(c => c.chapter_id === chapterId);
  if (!chapter) return;

  isEditorLoading = true;
  document.getElementById('report-empty-state').style.display = 'none';
  document.getElementById('report-chapter-actions').style.display = 'flex';
  document.getElementById('report-editor-card').style.display = 'block';
  document.getElementById('report-editor-title').textContent = chapter.title;

  // Show loading overlay
  showEditorLoading(true);

  // Destroy old editor first
  destroyEditor();

  // Fetch content
  let content = '';
  try {
    const data = await api.getReportPage(chapterId, 'main');
    content = data.content_raw || data.content || '';
  } catch {
    // Page might not exist yet
  }

  // Double-check chapter hasn't changed during fetch
  if (activeChapterId !== chapterId) {
    isEditorLoading = false;
    return;
  }

  // Init editor and wait until fully ready
  await initReportTinyMCE(content);
  showEditorLoading(false);
  isEditorLoading = false;
}

// ── Chapter CRUD ──

window.openReportChapterModal = function(chapter = null) {
  document.getElementById('report-chapter-modal-title').textContent = chapter ? '編輯章節' : '新增章節';
  document.getElementById('report-chapter-edit-id').value = chapter?.chapter_id || '';
  document.getElementById('report-chapter-slug').value = chapter?.chapter_id || '';
  document.getElementById('report-chapter-slug').disabled = !!chapter;
  document.getElementById('report-chapter-title').value = chapter?.title || '';

  // Show/hide docx upload for new chapters only
  const docxGroup = document.getElementById('report-chapter-docx-group');
  if (docxGroup) docxGroup.style.display = chapter ? 'none' : 'block';
  clearChapterDocx();

  document.getElementById('report-chapter-modal').classList.add('active');
};

window.closeReportChapterModal = function() {
  document.getElementById('report-chapter-modal').classList.remove('active');
  clearChapterDocx();
};

window.editReportChapter = function() {
  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  if (chapter) openReportChapterModal(chapter);
};

window.deleteReportChapter = async function() {
  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  if (!chapter) return;
  if (!confirm(`確定要刪除「${chapter.title}」章節嗎？此操作無法復原。`)) return;
  try {
    await api.deleteReportChapter(activeChapterId);
    showToast('已刪除章節', 'success');
    activeChapterId = null;
    await loadReportPages();
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

// ── Chapter Docx Upload (in modal) ──

window.handleChapterDocxSelect = function(input) {
  const file = input.files[0];
  if (file) showChapterDocxFile(file);
};

function showChapterDocxFile(file) {
  chapterDocxFile = file;
  const dropZone = document.getElementById('report-chapter-docx-drop');
  const nameContainer = document.getElementById('report-chapter-docx-name');

  dropZone.style.display = 'none';
  nameContainer.style.display = 'block';
  nameContainer.innerHTML =
    '<div style="padding:10px 14px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.25);border-radius:8px;margin-top:8px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:#22c55e">check_circle</span>' +
        '<span style="color:#22c55e;font-weight:500;font-size:13px">檔案已選擇</span>' +
        '<button type="button" onclick="clearChapterDocx()" style="margin-left:auto;background:none;border:none;color:#71717a;cursor:pointer;font-size:18px;line-height:1">&times;</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;padding-left:26px">' +
        '<span class="material-symbols-outlined" style="font-size:16px;color:#a1a1aa">description</span>' +
        '<span style="color:#e4e4e7;font-size:13px">' + escapeHtml(file.name) + '</span>' +
      '</div>' +
    '</div>';

  // Auto-fill title if empty
  const titleInput = document.getElementById('report-chapter-title');
  if (!titleInput.value.trim()) {
    titleInput.value = file.name.replace('.docx', '');
  }
}

window.clearChapterDocx = function() {
  chapterDocxFile = null;
  const dropZone = document.getElementById('report-chapter-docx-drop');
  const nameContainer = document.getElementById('report-chapter-docx-name');
  const fileInput = document.getElementById('report-chapter-docx-input');
  if (dropZone) dropZone.style.display = 'block';
  if (nameContainer) { nameContainer.style.display = 'none'; nameContainer.innerHTML = ''; }
  if (fileInput) fileInput.value = '';
};

function initChapterDocxDrop() {
  const dz = document.getElementById('report-chapter-docx-drop');
  if (!dz) return;
  ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, ev => {
    ev.preventDefault();
    dz.style.borderColor = '#3b82f6';
    dz.style.background = 'rgba(59,130,246,0.08)';
  }));
  ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, ev => {
    ev.preventDefault();
    dz.style.borderColor = '#3f3f46';
    dz.style.background = 'transparent';
  }));
  dz.addEventListener('drop', e => {
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.docx')) {
      showChapterDocxFile(f);
    } else {
      showToast('請選擇 .docx 檔案', 'error');
    }
  });
}

// ── TinyMCE Editor ──

let editorTheme = localStorage.getItem('report-editor-theme') || 'light';
let editorContent = '';

const THEME_CONFIG = {
  dark: {
    skin: 'oxide-dark',
    content_css: 'dark',
    content_style: `
      body { font-family: 'Noto Sans TC', sans-serif; font-size: 15px; line-height: 1.8; padding: 20px 28px; color: #e0e0e0; background: #1e2028; }
      h1 { font-size: 1.8em; margin: 0.6em 0 0.3em; color: #f4f4f5; display: flex; align-items: center; gap: 16px; }
      h1::after { content: ''; flex: 1; height: 1px; background: #555; opacity: 0.5; }
      h2 { font-size: 1.4em; margin: 0.5em 0 0.3em; color: #e4e4e7; padding-left: 12px; border-left: 4px solid #5b8def; }
      h3 { font-size: 1.1em; margin: 0.4em 0 0.2em; color: #d4d4d8; padding: 8px 14px; border-left: 3px solid #333; background: #22252f; border-radius: 0 8px 8px 0; }
      table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      table td, table th { border: 1px solid #555; padding: 8px 12px; }
      table th, thead td { background: #2a2d3a; font-weight: 600; color: #e0e0e0; }
      table th p, table th span, thead td p, thead td span { color: #e0e0e0; }
      table tr:first-child td p, table tr:first-child td span { color: inherit; }
      blockquote { border-left: 3px solid #2563eb; padding-left: 14px; color: #9ba1b0; margin: 12px 0; }
      img { max-width: 100%; border-radius: 4px; display: block; margin: 16px auto; }
      a { color: #60a5fa; }
      ul, ol { padding-left: 24px; }
      li { margin: 4px 0; }
    `
  },
  light: {
    skin: 'oxide',
    content_css: 'default',
    content_style: `
      body { font-family: 'Noto Sans TC', sans-serif; font-size: 15px; line-height: 1.8; padding: 20px 28px; color: #3D3832; background: #ffffff; }
      h1 { font-family: 'Noto Serif TC', serif; font-size: 28px; font-weight: 700; line-height: 38px; color: #2B3D6B; margin: 0 0 20px; display: flex; align-items: center; gap: 16px; }
      h1::after { content: ''; flex: 1; height: 1px; background: #2B3D6B; opacity: 0.3; }
      h2 { font-size: 20px; font-weight: 700; line-height: 30px; color: #2B3D6B; margin: 32px 0 12px; padding-left: 12px; border-left: 4px solid #2B3D6B; }
      h3 { font-size: 16px; font-weight: 600; color: #3D3832; margin: 20px 0 10px; padding: 10px 14px; border-left: 3px solid #EEEAE4; background: #F7F5F0; border-radius: 0 8px 8px 0; }
      h4 { font-size: 16px; font-weight: 700; color: #3D3832; margin: 20px 0 8px; }
      p { font-size: 15px; line-height: 28px; color: #3D3832; margin: 0 0 14px; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px; }
      table td, table th { border: 1px solid #EEEAE4; padding: 10px 14px; text-align: left; line-height: 1.6; }
      table th, thead td { background: #2B3D6B; font-weight: 600; color: white; font-size: 13px; }
      table th *, thead td * { color: white; }
      table td { color: #3D3832; font-size: 14px; }
      tr:nth-child(even) td { background: #F7F5F0; }
      blockquote { border-left: 3px solid #2B3D6B; padding: 10px 14px; margin: 14px 0; background: #F7F5F0; border-radius: 0 8px 8px 0; }
      blockquote p { color: #6B6356; margin-bottom: 4px; font-size: 14px; line-height: 26px; }
      img { max-width: 100%; border-radius: 8px; display: block; margin: 12px auto; }
      a { color: #2B3D6B; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul, ol { padding-left: 24px; margin: 0 0 14px; }
      li { font-size: 15px; line-height: 28px; color: #3D3832; margin-bottom: 4px; }
      strong { font-weight: 700; }
      hr { border: none; border-top: 1px solid #EEEAE4; margin: 24px 0; }
    `
  }
};

function destroyEditor() {
  const editor = tinymce.get('report-tinymce-editor');
  if (editor) {
    editor.remove();
  }
  editorContent = '';
}

function initReportTinyMCE(content) {
  return new Promise((resolve) => {
  destroyEditor();
  editorContent = content || '';
  const theme = THEME_CONFIG[editorTheme] || THEME_CONFIG.light;

  updateThemeToggleBtn();

  tinymce.init({
    selector: '#report-tinymce-editor',
    height: '100%',
    skin: theme.skin,
    content_css: theme.content_css,
    promotion: false,
    branding: false,
    menubar: 'edit view insert format table',
    plugins: 'table lists link image code fullscreen searchreplace wordcount visualblocks',
    toolbar: [
      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor',
      'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table link galleryimage | code fullscreen'
    ],
    block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Blockquote=blockquote',
    font_family_formats: 'Noto Sans TC=Noto Sans TC,sans-serif; Noto Serif TC=Noto Serif TC,serif; Arial=arial,helvetica,sans-serif; Times New Roman=times new roman,times,serif; Microsoft JhengHei=Microsoft JhengHei,微軟正黑體,sans-serif; DFKai-SB=DFKai-SB,標楷體,serif; PMingLiU=PMingLiU,新細明體,serif; Georgia=georgia,serif; Verdana=verdana,sans-serif; Courier New=courier new,courier,monospace',
    font_size_formats: '8pt 9pt 10pt 11pt 12pt 13pt 14pt 15pt 16pt 18pt 20pt 22pt 24pt 28pt 32pt 36pt 48pt',
    font_size_input_default_unit: 'pt',
    table_default_styles: { 'border-collapse': 'collapse', 'width': '100%' },
    table_default_attributes: { border: '1' },
    table_header_type: 'sectionCells',
    table_advtab: true,
    table_cell_advtab: true,
    table_row_advtab: true,
    table_appearance_options: true,
    table_use_colgroups: false,
    content_style: theme.content_style,
    setup(editor) {
      editor.ui.registry.addButton('galleryimage', {
        icon: 'image',
        tooltip: '插入圖片（圖片管理 / 上傳）',
        onAction: () => openReportImagePicker()
      });

      editor.on('init', () => {
        if (editorContent) editor.setContent(editorContent);
        resolve();
      });
    }
  });
  }); // end Promise
}

window.toggleEditorTheme = async function() {
  editorTheme = editorTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('report-editor-theme', editorTheme);
  // Save current content before theme switch
  const editor = getReportEditor();
  const currentContent = editor ? editor.getContent() : editorContent;
  showEditorLoading(true);
  await initReportTinyMCE(currentContent);
  showEditorLoading(false);
};

function updateThemeToggleBtn() {
  const btn = document.getElementById('editor-theme-toggle');
  if (btn) {
    const icon = btn.querySelector('.material-symbols-outlined');
    const label = btn.querySelector('.theme-label');
    if (icon) icon.textContent = editorTheme === 'dark' ? 'light_mode' : 'dark_mode';
    if (label) label.textContent = editorTheme === 'dark' ? '淺色' : '深色';
  }
}

function getReportEditor() {
  return tinymce.get('report-tinymce-editor');
}

// ── Convert Tables to Images (for frontend display) ──

async function convertTablesToImages(htmlContent) {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;padding:16px;z-index:-1;width:1200px';
  container.innerHTML = `<style>
    * { font-family: 'Noto Sans TC', sans-serif; -webkit-font-smoothing: antialiased; }
    table { border-collapse: collapse; width: 100%; margin: 0; font-size: 15px; }
    td, th { border: 1px solid #EEEAE4; padding: 12px 16px; text-align: left; line-height: 1.7; color: #3D3832; }
    th, thead td { background: #2B3D6B; font-weight: 600; color: white; font-size: 14px; }
    th p, th span, thead td p, thead td span { color: white; margin: 0; }
    tr:nth-child(even) td { background: #F7F5F0; }
    p { margin: 4px 0; font-size: 15px; }
    strong { font-weight: 700; }
  </style>` + htmlContent;
  document.body.appendChild(container);

  const tables = container.querySelectorAll('table');
  const replacements = [];

  for (const table of tables) {
    try {
      const canvas = await html2canvas(table, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);

      // Upload to gallery
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'table-' + Date.now() + '-' + replacements.length + '.png', { type: 'image/png' });
      const data = await api.uploadGalleryImage(file, 'report-table');
      const imgUrl = '/uploads/gallery/' + data.filename;
      const imgTag = '<img src="' + imgUrl + '" alt="資料表格" style="max-width:100%;display:block;margin:0 auto" />';
      replacements.push({ original: table.outerHTML, replacement: imgTag });
    } catch (err) {
      console.warn('Table to image failed:', err);
    }
  }

  document.body.removeChild(container);

  let result = htmlContent;
  for (const { original, replacement } of replacements) {
    result = result.replace(original, replacement);
  }
  return result;
}

// ── Save ──

window.saveReportEditor = async function() {
  if (!activeChapterId) return;
  const editor = getReportEditor();
  if (!editor) return;

  const contentRaw = editor.getContent(); // Tables as HTML (for editor)

  try {
    // Ensure "main" page exists
    try {
      await api.getReportPage(activeChapterId, 'main');
    } catch {
      const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
      await api.createReportPage(activeChapterId, { page_id: 'main', title: chapter?.title || activeChapterId });
    }

    // Delete old table images from gallery before regenerating
    try {
      const existingData = await api.getReportPage(activeChapterId, 'main');
      const oldContent = existingData.content || '';
      const oldTableImgs = oldContent.match(/uploads\/gallery\/([a-zA-Z0-9._-]+)/g) || [];
      const rawImgs = (contentRaw.match(/uploads\/gallery\/([a-zA-Z0-9._-]+)/g) || []);
      // Only delete images that are table-generated (exist in content but not in content_raw)
      const rawImgSet = new Set(rawImgs);
      for (const imgPath of oldTableImgs) {
        if (!rawImgSet.has(imgPath)) {
          // This image was auto-generated (table→img), safe to delete
          const filename = imgPath.replace('uploads/gallery/', '');
          try {
            const gallery = await api.getGallery('report-table');
            const img = gallery.find(g => g.filename === filename);
            if (img) {
              const token = localStorage.getItem('token');
              await fetch('/api/gallery/' + img.id, {
                method: 'DELETE',
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
              });
            }
          } catch { /* ignore delete errors */ }
        }
      }
    } catch { /* ignore */ }

    // Convert tables to images for frontend display
    let contentForFrontend = contentRaw;
    const tableCount = (contentRaw.match(/<table/g) || []).length;
    if (tableCount > 0) {
      showToast(`轉換 ${tableCount} 個表格為圖片中...`, 'success');
      try {
        contentForFrontend = await convertTablesToImages(contentRaw);
      } catch (err) {
        console.warn('Table conversion failed, using raw:', err);
      }
    }

    // Save both versions
    const token = localStorage.getItem('token');
    const res = await fetch('/api/report-pages/' + activeChapterId + '/main', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify({
        content: contentForFrontend,   // tables as images (for /report/)
        content_raw: contentRaw        // tables as HTML (for editor)
      })
    });
    if (!res.ok) throw new Error('儲存失敗');
    showToast('儲存成功！', 'success');
  } catch (err) {
    showToast('儲存失敗：' + err.message, 'error');
  }
};

// ── DOCX Import / Export ──

/**
 * Post-process mammoth HTML output to detect headings from plain <p> text.
 *
 * The Harvard docx files don't use Word heading styles, so mammoth outputs
 * everything as <p>. We detect heading patterns based on Chinese report conventions:
 *
 *   h1: First short standalone <p> = chapter title (e.g. "社區網絡的深耕共伴")
 *   h2: Chinese numbered sections (e.g. "一、摘要" "二、影響力模式")
 *   h3: Parenthesized sub-sections (e.g. "(一)生活安居" "（二）學習發展")
 *   h4: Numbered items (e.g. "1. 專案介紹" "2. 影響力成果")
 */
function postProcessMammothHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let foundH1 = !!doc.querySelector('h1');

  const allPs = Array.from(doc.querySelectorAll('p'));

  for (const p of allPs) {
    // Skip <p> inside tables
    if (p.closest('table')) continue;

    const text = p.textContent.trim();
    if (!text || text.length > 80) continue;

    // Skip paragraphs with sentence-like content (contains 。，)
    if (text.length > 40 && (text.includes('。') || text.includes('，'))) continue;

    let tag = null;

    // Rule: Chinese numbered major sections → h2
    // "一、摘要" "二、影響力模式" "三、專案成果亮點"
    if (/^[一二三四五六七八九十]+、/.test(text)) {
      tag = 'h2';
    }
    // Rule: Parenthesized sub-sections → h3
    // "(一)生活安居" "（二）學習發展"
    else if (/^[（(][一二三四五六七八九十]+[）)]/.test(text)) {
      tag = 'h3';
    }
    // Rule: Numbered items → h4
    // "1. 專案介紹" "2. 影響力成果"
    else if (/^\d+[.、]\s*\S/.test(text) && text.length < 30) {
      tag = 'h4';
    }
    // Rule: First short standalone <p> = chapter title → h1
    else if (!foundH1 && text.length < 40 && !text.includes('。') && !text.includes('，') && !text.includes('：')) {
      tag = 'h1';
    }

    if (tag) {
      if (tag === 'h1') foundH1 = true;
      const heading = doc.createElement(tag);
      heading.innerHTML = p.innerHTML;
      p.parentNode.replaceChild(heading, p);
    }
  }

  // Center images
  doc.querySelectorAll('img').forEach(img => {
    img.style.display = 'block';
    img.style.margin = '16px auto';
    img.style.maxWidth = '100%';
  });

  return doc.body.innerHTML;
}

/**
 * Extract base64 images from HTML, upload to /api/gallery, replace with server URLs.
 * Mammoth embeds docx images as data:image/... base64 strings.
 */
/**
 * Extract base64 images from HTML, upload to gallery (same as 圖庫管理),
 * replace with /uploads/gallery/ URLs.
 */
async function uploadEmbeddedImages(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[src^="data:image"]');

  if (images.length === 0) return html;

  showToast(`上傳 ${images.length} 張圖片中...`, 'success');
  let uploaded = 0;

  for (const img of images) {
    try {
      const src = img.getAttribute('src');
      const res = await fetch(src);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'png';
      const file = new File([blob], `docx-img-${Date.now()}-${uploaded}.${ext}`, { type: blob.type });

      // Use same api.uploadGalleryImage as 圖庫管理
      const data = await api.uploadGalleryImage(file, 'general');
      img.setAttribute('src', '/uploads/gallery/' + data.filename);
      img.style.display = 'block';
      img.style.margin = '16px auto';
      img.style.maxWidth = '100%';
      uploaded++;
    } catch (err) {
      console.warn('Image upload failed:', err);
    }
  }

  if (uploaded > 0) {
    showToast(`已上傳 ${uploaded} 張圖片到圖庫`, 'success');
  }

  return doc.body.innerHTML;
}

window.importReportDocx = async function(input) {
  const file = input.files[0];
  if (!file) return;
  const editor = getReportEditor();
  if (!editor) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ]
    });
    let processed = postProcessMammothHtml(result.value);
    // Upload embedded base64 images to server
    processed = await uploadEmbeddedImages(processed);
    editor.setContent(processed);
    showToast('已匯入 .docx 內容，請檢查標題格式（H1/H2）', 'success');
  } catch (err) {
    showToast('匯入失敗: ' + err.message, 'error');
  }
  input.value = '';
};

window.exportReportDocx = function() {
  const editor = getReportEditor();
  if (!editor) return;

  const chapter = chaptersData.find(c => c.chapter_id === activeChapterId);
  const fileName = (chapter?.title || 'report') + '.docx';

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: '微軟正黑體','Noto Sans TC',sans-serif; font-size: 12pt; line-height: 1.6; color: #222; }
      h1 { font-size: 22pt; } h2 { font-size: 18pt; } h3 { font-size: 14pt; }
      table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
      table td, table th { border: 1px solid #999; padding: 6pt 10pt; }
      table th { background: #e8e8e8; font-weight: bold; }
      blockquote { border-left: 3px solid #ccc; padding-left: 12px; color: #555; }
      img { max-width: 100%; }
    </style></head><body>${editor.getContent()}</body></html>`;

  try {
    const docxLib = window.htmlDocx || window.HTMLDocx;
    if (!docxLib) { showToast('匯出元件未載入，請重新整理頁面', 'error'); return; }
    const blob = docxLib.asBlob(fullHtml, {
      orientation: 'portrait',
      margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('已匯出 ' + fileName, 'success');
  } catch (err) {
    showToast('匯出失敗: ' + err.message, 'error');
  }
};

// ── Report Image Picker ──

window.openReportImagePicker = function() {
  reportPickerSelectedId = null;
  document.querySelectorAll('[data-report-picker-cat]').forEach(t => {
    t.classList.toggle('active', t.dataset.reportPickerCat === '');
  });
  loadReportPickerGallery('');
  document.getElementById('report-image-picker-modal').classList.add('active');
};

window.closeReportImagePicker = function() {
  document.getElementById('report-image-picker-modal').classList.remove('active');
  reportPickerSelectedId = null;
};

window.switchReportPickerCategory = function(btn) {
  document.querySelectorAll('[data-report-picker-cat]').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  loadReportPickerGallery(btn.dataset.reportPickerCat);
};

async function loadReportPickerGallery(category) {
  const grid = document.getElementById('report-picker-grid');
  grid.innerHTML = '<div style="padding:24px;text-align:center;color:#71717a">載入中...</div>';
  try {
    reportPickerGallery = await api.getGallery(category);
    if (reportPickerGallery.length === 0) {
      grid.innerHTML = '<div style="padding:24px;text-align:center;color:#71717a">此分類沒有圖片</div>';
      return;
    }
    grid.innerHTML = reportPickerGallery.map(img => `
      <div class="picker-gallery-item ${reportPickerSelectedId === img.id ? 'selected' : ''}"
           data-id="${img.id}" onclick="selectReportPickerImage(${img.id})">
        <img src="/uploads/gallery/${img.filename}" alt="${img.original_name || ''}">
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<div style="padding:24px;text-align:center;color:#ef4444">載入失敗</div>';
  }
}

window.selectReportPickerImage = function(id) {
  reportPickerSelectedId = id;
  document.querySelectorAll('#report-picker-grid .picker-gallery-item').forEach(item => {
    item.classList.toggle('selected', parseInt(item.dataset.id) === id);
  });
};

window.confirmReportImageSelection = function() {
  if (!reportPickerSelectedId) {
    closeReportImagePicker();
    return;
  }
  const img = reportPickerGallery.find(i => i.id === reportPickerSelectedId);
  if (!img) { closeReportImagePicker(); return; }

  const imageUrl = `/uploads/gallery/${img.filename}`;
  const editor = getReportEditor();
  if (editor) {
    editor.insertContent(`<p style="text-align:center"><img src="${imageUrl}" style="max-width:100%;display:block;margin:0 auto" /></p>`);
  }
  closeReportImagePicker();
};

function initReportPickerUpload() {
  const uploadBtn = document.getElementById('report-picker-upload-btn');
  const uploadInput = document.getElementById('report-picker-upload-input');
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', async () => {
      const file = uploadInput.files[0];
      if (!file) return;
      const statusEl = document.getElementById('report-picker-upload-status');
      statusEl.textContent = '上傳中...';
      uploadBtn.disabled = true;
      try {
        const result = await api.uploadGalleryImage(file, 'general');
        statusEl.textContent = '上傳成功';
        const activeTab = document.querySelector('[data-report-picker-cat].active');
        await loadReportPickerGallery(activeTab?.dataset.reportPickerCat || '');
        if (result && result.id) {
          selectReportPickerImage(result.id);
        }
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      } catch (e) {
        statusEl.textContent = '';
        showToast(e.message || '上傳失敗', 'error');
      } finally {
        uploadBtn.disabled = false;
        uploadInput.value = '';
      }
    });
  }
}

// ── Form Handler ──

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
        activeChapterId = slug;

        // Create "main" page for this chapter
        await api.createReportPage(slug, { page_id: 'main', title });

        // If docx file provided, import content
        if (chapterDocxFile) {
          try {
            const arrayBuffer = await chapterDocxFile.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer }, {
              styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "p[style-name='Heading 3'] => h3:fresh",
                "p[style-name='Heading 4'] => h4:fresh",
                "p[style-name='Title'] => h1:fresh",
                "p[style-name='Subtitle'] => h2:fresh",
              ]
            });
            let processed = postProcessMammothHtml(result.value);
            processed = await uploadEmbeddedImages(processed);
            await api.updateReportPageContent(slug, 'main', processed);
            showToast('章節已新增並匯入 .docx', 'success');
          } catch (docxErr) {
            console.error('Docx import failed:', docxErr);
            showToast('章節已新增，但 .docx 匯入失敗', 'error');
          }
        } else {
          showToast('章節已新增', 'success');
        }
      }
      closeReportChapterModal();
      await loadReportPages();
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
  initReportPickerUpload();
  initChapterDocxDrop();
}
