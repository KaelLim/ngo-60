// Blessings Module
import { api } from './api.js';
import { showToast } from './toast.js';
import { updateImagePreview } from './image-picker.js';

let blessingsCache = [];

export async function loadBlessings() {
  try {
    blessingsCache = await api.getBlessings();
    renderBlessingsTable();
  } catch (e) {
    console.error('Failed to load blessings:', e);
  }
}

function renderBlessingsTable() {
  const tbody = document.getElementById('blessings-table');
  tbody.innerHTML = blessingsCache.map(b => {
    const content = b.full_content || b.message || '';
    const preview = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    return `
    <tr>
      <td>${b.sort_order}</td>
      <td>${b.author}</td>
      <td>${preview}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${b.id}">編輯</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${b.id}">刪除</button>
      </td>
    </tr>
  `;
  }).join('');

  // Add event listeners
  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editBlessing(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteBlessing(parseInt(btn.dataset.id)));
  });
}

export function openBlessingModal(blessing = null) {
  document.getElementById('blessing-modal-title').textContent = blessing ? '編輯祝福語' : '新增祝福語';
  document.getElementById('blessing-id').value = blessing?.id || '';
  document.getElementById('blessing-author').value = blessing?.author || '';
  document.getElementById('blessing-content').value = blessing?.full_content || '';
  document.getElementById('blessing-image').value = blessing?.image_url || '';
  document.getElementById('blessing-sort').value = blessing?.sort_order || 0;
  updateImagePreview('blessing-image', blessing?.image_url);
  document.getElementById('blessing-modal').classList.add('active');
}

export function closeBlessingModal() {
  document.getElementById('blessing-modal').classList.remove('active');
}

function editBlessing(id) {
  const blessing = blessingsCache.find(b => b.id === id);
  openBlessingModal(blessing);
}

async function deleteBlessing(id) {
  if (!confirm('確定要刪除此祝福語？')) return;
  try {
    await api.deleteBlessing(id);
    showToast('祝福語已刪除');
    loadBlessings();
  } catch (e) {
    showToast('刪除失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('blessing-id').value;
  const fullContent = document.getElementById('blessing-content').value;
  // 自動從完整內容擷取前 50 字作為訊息摘要
  const message = fullContent.substring(0, 50).replace(/\n/g, ' ');
  const data = {
    author: document.getElementById('blessing-author').value,
    message: message,
    full_content: fullContent,
    image_url: document.getElementById('blessing-image').value,
    sort_order: parseInt(document.getElementById('blessing-sort').value)
  };

  try {
    if (id) {
      await api.updateBlessing(id, data);
      showToast('祝福語已更新');
    } else {
      await api.createBlessing(data);
      showToast('祝福語已新增');
    }
    closeBlessingModal();
    loadBlessings();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

export function initBlessings() {
  document.getElementById('blessing-form').addEventListener('submit', handleSubmit);
}
