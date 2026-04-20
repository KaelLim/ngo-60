// Impact Module
import { api } from './api.js';
import { showToast } from './toast.js';

let impactCache = [];

// ============ Impact Config ============

async function loadImpactConfig() {
  try {
    const config = await api.getImpactConfig();
    document.getElementById('impact-config-main-title').value = config.main_title || '';
    document.getElementById('impact-config-subtitle').value = config.subtitle || '';
    document.getElementById('impact-config-published').checked = config.published === 1;
    document.getElementById('video-section-title').value = config.video_section_title || '';
    document.getElementById('video-playlist-id').value = config.video_playlist_id || '';
    document.getElementById('video-published').checked = config.video_published === 1;

    // Load video preview if playlist ID exists
    if (config.video_playlist_id) {
      loadVideoPreview(config.video_playlist_id);
    }

    // Load report PDF status
    updateReportPdfUI(config.report_pdf_url);
  } catch (e) {
    console.error('Failed to load impact config:', e);
  }
}

function updateReportPdfUI(pdfUrl) {
  const statusEl = document.getElementById('report-pdf-status');
  const downloadEl = document.getElementById('report-pdf-download');
  const deleteEl = document.getElementById('report-pdf-delete');
  if (pdfUrl) {
    statusEl.innerHTML = '<span style="color:#22c55e">✓ 已上傳</span>';
    downloadEl.href = pdfUrl;
    downloadEl.style.display = 'inline-flex';
    deleteEl.style.display = 'inline-flex';
  } else {
    statusEl.innerHTML = '<span style="color:#71717a">尚未上傳 PDF</span>';
    downloadEl.style.display = 'none';
    deleteEl.style.display = 'none';
  }
}

window.uploadReportPdf = async function(input) {
  const file = input.files[0];
  if (!file) return;

  const statusEl = document.getElementById('report-pdf-status');
  statusEl.innerHTML = '<span style="color:#a1a1aa">上傳中...</span>';

  try {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const res = await fetch('/api/impact-config/pdf', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    });
    if (!res.ok) throw new Error('上傳失敗');
    const data = await res.json();
    updateReportPdfUI(data.url);
    showToast('PDF 上傳成功', 'success');
  } catch (err) {
    statusEl.innerHTML = '<span style="color:#ef4444">上傳失敗</span>';
    showToast('PDF 上傳失敗：' + err.message, 'error');
  }
  input.value = '';
};

window.deleteReportPdf = async function() {
  if (!confirm('確定要刪除報告書 PDF 嗎？')) return;
  try {
    const token = localStorage.getItem('token');
    await fetch('/api/impact-config/pdf', {
      method: 'DELETE',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });
    updateReportPdfUI('');
    showToast('PDF 已刪除', 'success');
  } catch (err) {
    showToast('刪除失敗：' + err.message, 'error');
  }
};

async function loadVideoPreview(playlistId) {
  const previewEl = document.getElementById('video-preview');
  const contentEl = document.getElementById('video-preview-content');
  try {
    const res = await fetch(`/api/tc-tool/youtube/fetch/playlist/${playlistId}`);
    if (!res.ok) throw new Error('Fetch failed');
    const videos = await res.json();
    if (videos.length > 0) {
      previewEl.style.display = 'block';
      contentEl.innerHTML = videos.slice(0, 5).map(v => `
        <div style="flex-shrink: 0; width: 160px;">
          <img src="${v.thumbnailUrl}" alt="${v.title}" style="width: 160px; height: 90px; object-fit: cover; border-radius: 8px;">
          <p style="font-size: 12px; margin: 4px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.title}</p>
        </div>
      `).join('') + `<div style="flex-shrink: 0; display: flex; align-items: center; padding: 0 12px; color: #888; font-size: 13px;">共 ${videos.length} 部影片</div>`;
    }
  } catch (e) {
    previewEl.style.display = 'none';
  }
}

async function handleConfigSubmit(e) {
  e.preventDefault();
  const data = {
    main_title: document.getElementById('impact-config-main-title').value,
    subtitle: document.getElementById('impact-config-subtitle').value,
    published: document.getElementById('impact-config-published').checked ? 1 : 0
  };
  try {
    await api.updateImpactConfig(data);
    showToast('影響力設定已儲存');
  } catch (e) {
    showToast('儲存失敗', 'error');
  }
}

// ============ Impact Nodes (sections) ============

export async function loadImpact() {
  try {
    impactCache = await api.getImpact();
    renderImpactTable();
    loadImpactConfig();
  } catch (e) {
    console.error('Failed to load impact:', e);
  }
}

function renderImpactTable() {
  const tbody = document.getElementById('impact-table');
  tbody.innerHTML = impactCache.map(item => `
    <tr>
      <td>${item.sort_order}</td>
      <td>${item.icon}</td>
      <td>${item.name}</td>
      <td>${item.stat_label || '-'}</td>
      <td>${item.stat_value || '-'}</td>
      <td>${item.stat_unit || '-'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${item.id}">編輯</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${item.id}">刪除</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editImpact(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteImpact(parseInt(btn.dataset.id)));
  });
}

export function openImpactModal(item = null) {
  document.getElementById('impact-modal-title').textContent = item ? '編輯影響力節點' : '新增影響力節點';
  document.getElementById('impact-id').value = item?.id || '';
  document.getElementById('impact-name').value = item?.name || '';
  document.getElementById('impact-icon').value = item?.icon || '';
  document.getElementById('impact-sort').value = item?.sort_order || 0;
  document.getElementById('impact-stat-label').value = item?.stat_label || '';
  document.getElementById('impact-stat-value').value = item?.stat_value || '';
  document.getElementById('impact-stat-unit').value = item?.stat_unit || '';
  document.getElementById('impact-modal').classList.add('active');
}

export function closeImpactModal() {
  document.getElementById('impact-modal').classList.remove('active');
}

function editImpact(id) {
  const item = impactCache.find(i => i.id === id);
  openImpactModal(item);
}

async function deleteImpact(id) {
  if (!confirm('確定要刪除此影響力節點？')) return;
  try {
    await api.deleteImpact(id);
    showToast('影響力節點已刪除');
    loadImpact();
  } catch (e) {
    showToast(e.message || '刪除失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('impact-id').value;
  const data = {
    name: document.getElementById('impact-name').value,
    icon: document.getElementById('impact-icon').value,
    sort_order: parseInt(document.getElementById('impact-sort').value),
    stat_label: document.getElementById('impact-stat-label').value,
    stat_value: document.getElementById('impact-stat-value').value,
    stat_unit: document.getElementById('impact-stat-unit').value
  };

  try {
    if (id) {
      await api.updateImpact(id, data);
      showToast('影響力節點已更新');
    } else {
      await api.createImpact(data);
      showToast('影響力節點已新增');
    }
    closeImpactModal();
    loadImpact();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

async function handleVideoConfigSubmit(e) {
  e.preventDefault();
  const data = {
    video_section_title: document.getElementById('video-section-title').value || '來自全球的祝福',
    video_playlist_id: document.getElementById('video-playlist-id').value || null,
    video_published: document.getElementById('video-published').checked ? 1 : 0
  };
  try {
    await api.updateImpactConfig(data);
    showToast('雲端影音設定已儲存');
    // Refresh preview
    if (data.video_playlist_id) {
      loadVideoPreview(data.video_playlist_id);
    }
  } catch (e) {
    showToast('儲存失敗', 'error');
  }
}

export function initImpact() {
  document.getElementById('impact-form').addEventListener('submit', handleSubmit);
  document.getElementById('impact-config-form').addEventListener('submit', handleConfigSubmit);
  document.getElementById('video-config-form').addEventListener('submit', handleVideoConfigSubmit);
}
