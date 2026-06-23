// Blessing Tags Module
import { api } from './api.js';
import { showToast } from './toast.js';

let tagsCache = [];

async function loadBlessingConfig() {
  try {
    const config = await api.getImpactConfig();
    document.getElementById('blessing-config-title').value = config.blessing_title || '';
    document.getElementById('blessing-config-section-name').value = config.blessing_section_name || '';
    document.getElementById('blessing-config-published').checked = config.blessing_published === 1;
  } catch (e) {
    console.error('Failed to load blessing config:', e);
  }
}

async function handleBlessingConfigSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('blessing-config-title').value;
  const sectionName = document.getElementById('blessing-config-section-name').value;
  const published = document.getElementById('blessing-config-published').checked ? 1 : 0;
  const data = { blessing_title: title, blessing_section_name: sectionName || null, blessing_published: published };
  try {
    const result = await api.updateImpactConfig(data);
    // Reload form with saved values from server
    document.getElementById('blessing-config-title').value = result.blessing_title || '';
    document.getElementById('blessing-config-section-name').value = result.blessing_section_name || '';
    document.getElementById('blessing-config-published').checked = result.blessing_published === 1;
    showToast('祝福區塊設定已儲存');
  } catch (e) {
    showToast('儲存失敗', 'error');
  }
}

export async function updateReviewBadge() {
  try {
    const { count } = await api.getReviewWords();
    const badge = document.getElementById('review-nav-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  } catch (e) { /* not admin / not logged in: ignore */ }
}

async function loadReviewWords() {
  const card = document.getElementById('review-words-card');
  const tbody = document.getElementById('review-words-table');
  if (!card || !tbody) return;
  try {
    const { words, count } = await api.getReviewWords();
    const badge = document.getElementById('review-nav-badge');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? '' : 'none'; }
    document.getElementById('review-count-inline').textContent = count > 0 ? `(${count})` : '';
    if (count === 0) { card.style.display = 'none'; return; }
    card.style.display = '';
    tbody.innerHTML = words.map(w => `
      <tr>
        <td>${w.word}</td>
        <td>${w.lang || ''}</td>
        <td class="actions">
          <button class="btn btn-danger btn-sm" data-action="keep" data-id="${w.id}">確實不當</button>
          <button class="btn btn-secondary btn-sm" data-action="allow" data-id="${w.id}">其實正常</button>
        </td>
      </tr>`).join('');
    tbody.querySelectorAll('[data-action="keep"]').forEach(b =>
      b.addEventListener('click', () => keepWord(parseInt(b.dataset.id))));
    tbody.querySelectorAll('[data-action="allow"]').forEach(b =>
      b.addEventListener('click', () => allowWord(parseInt(b.dataset.id))));
  } catch (e) { console.error('load review words failed', e); }
}

async function keepWord(id) {
  try { await api.keepBlockedWord(id); showToast('已保留為敏感詞'); loadReviewWords(); }
  catch { showToast('操作失敗', 'error'); }
}
async function allowWord(id) {
  try { await api.allowBlockedWord(id); showToast('已標記為正常'); loadReviewWords(); }
  catch { showToast('操作失敗', 'error'); }
}

export async function loadBlessingTags() {
  try {
    tagsCache = await api.getBlessingTags();
    renderTagsTable();
    loadReviewWords();
    loadBlessingConfig();
  } catch (e) {
    console.error('Failed to load blessing tags:', e);
  }
}

function renderTagsTable() {
  const tbody = document.getElementById('blessing-tags-table');
  tbody.innerHTML = tagsCache.map(tag => `
    <tr>
      <td>${tag.id}</td>
      <td>${tag.message}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${tag.id}">編輯</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${tag.id}">刪除</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editTag(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteTag(parseInt(btn.dataset.id)));
  });
}

export function openBlessingTagModal(tag = null) {
  document.getElementById('blessing-tag-modal-title').textContent = tag ? '編輯祝福標籤' : '新增祝福標籤';
  document.getElementById('blessing-tag-id').value = tag?.id || '';
  document.getElementById('blessing-tag-message').value = tag?.message || '';
  document.getElementById('blessing-tag-modal').classList.add('active');
}

export function closeBlessingTagModal() {
  document.getElementById('blessing-tag-modal').classList.remove('active');
}

function editTag(id) {
  const tag = tagsCache.find(t => t.id === id);
  openBlessingTagModal(tag);
}

async function deleteTag(id) {
  if (!confirm('確定要刪除此祝福標籤？')) return;
  try {
    await api.deleteBlessingTag(id);
    showToast('祝福標籤已刪除');
    loadBlessingTags();
  } catch (e) {
    showToast('刪除失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('blessing-tag-id').value;
  const data = {
    message: document.getElementById('blessing-tag-message').value
  };

  try {
    if (id) {
      await api.updateBlessingTag(id, data);
      showToast('祝福標籤已更新');
    } else {
      await api.createBlessingTag(data);
      showToast('祝福標籤已新增');
    }
    closeBlessingTagModal();
    loadBlessingTags();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

export function initBlessingTags() {
  document.getElementById('blessing-tag-form').addEventListener('submit', handleSubmit);
  document.getElementById('blessing-config-form').addEventListener('submit', handleBlessingConfigSubmit);
}
