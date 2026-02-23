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
  } catch (e) {
    console.error('Failed to load impact config:', e);
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

export function initImpact() {
  document.getElementById('impact-form').addEventListener('submit', handleSubmit);
  document.getElementById('impact-config-form').addEventListener('submit', handleConfigSubmit);
}
