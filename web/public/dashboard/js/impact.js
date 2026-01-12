// Impact Module
import { api } from './api.js';
import { showToast } from './toast.js';

let impactCache = [];

export async function loadImpact() {
  try {
    impactCache = await api.getImpact();
    renderImpactTable();
  } catch (e) {
    console.error('Failed to load impact:', e);
  }
}

function renderImpactTable() {
  const tbody = document.getElementById('impact-table');
  tbody.innerHTML = impactCache.map(i => `
    <tr>
      <td>${i.sort_order}</td>
      <td>${i.icon}</td>
      <td>${i.name}</td>
      <td>${i.stat_value || '-'}</td>
      <td>${i.stat_label || '-'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${i.id}">編輯</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${i.id}">刪除</button>
      </td>
    </tr>
  `).join('');

  // Add event listeners
  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editImpact(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteImpact(parseInt(btn.dataset.id)));
  });
}

export function openImpactModal(impact = null) {
  document.getElementById('impact-modal-title').textContent = impact ? '編輯影響力區塊' : '新增影響力區塊';
  document.getElementById('impact-id').value = impact?.id || '';
  document.getElementById('impact-name').value = impact?.name || '';
  document.getElementById('impact-icon').value = impact?.icon || '';
  document.getElementById('impact-value').value = impact?.stat_value || '';
  document.getElementById('impact-label').value = impact?.stat_label || '';
  document.getElementById('impact-sort').value = impact?.sort_order || 0;
  document.getElementById('impact-modal').classList.add('active');
}

export function closeImpactModal() {
  document.getElementById('impact-modal').classList.remove('active');
}

function editImpact(id) {
  const impact = impactCache.find(i => i.id === id);
  openImpactModal(impact);
}

async function deleteImpact(id) {
  if (!confirm('確定要刪除此影響力區塊？')) return;
  try {
    await api.deleteImpact(id);
    showToast('影響力區塊已刪除');
    loadImpact();
  } catch (e) {
    showToast('刪除失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('impact-id').value;
  const data = {
    name: document.getElementById('impact-name').value,
    icon: document.getElementById('impact-icon').value,
    stat_value: document.getElementById('impact-value').value,
    stat_label: document.getElementById('impact-label').value,
    sort_order: parseInt(document.getElementById('impact-sort').value)
  };

  try {
    if (id) {
      await api.updateImpact(id, data);
      showToast('影響力區塊已更新');
    } else {
      await api.createImpact(data);
      showToast('影響力區塊已新增');
    }
    closeImpactModal();
    loadImpact();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

export function initImpact() {
  document.getElementById('impact-form').addEventListener('submit', handleSubmit);
}
