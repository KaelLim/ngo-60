// Topics Module
import { api } from './api.js';
import { showToast } from './toast.js';
import { updateImagePreview } from './image-picker.js';

let topicsCache = [];

export function getTopicsCache() {
  return topicsCache;
}

export async function loadTopics() {
  try {
    topicsCache = await api.getTopics();
    renderTopicsTable();
  } catch (e) {
    console.error('Failed to load topics:', e);
  }
}

function renderTopicsTable() {
  const tbody = document.getElementById('topics-table');
  tbody.innerHTML = topicsCache.map(t => `
    <tr>
      <td>${t.sort_order}</td>
      <td>${t.icon}</td>
      <td>${t.name}</td>
      <td>${t.subtitle || '-'}</td>
      <td class="actions">
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${t.id}">編輯</button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${t.id}">刪除</button>
      </td>
    </tr>
  `).join('');

  // Add event listeners
  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editTopic(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteTopic(parseInt(btn.dataset.id)));
  });
}

export function openTopicModal(topic = null) {
  document.getElementById('topic-modal-title').textContent = topic ? '編輯主題' : '新增主題';
  document.getElementById('topic-id').value = topic?.id || '';
  document.getElementById('topic-name').value = topic?.name || '';
  document.getElementById('topic-icon').value = topic?.icon || '';
  document.getElementById('topic-subtitle').value = topic?.subtitle || '';
  document.getElementById('topic-description').value = topic?.description || '';
  document.getElementById('topic-background').value = topic?.background_image || '';
  document.getElementById('topic-sort').value = topic?.sort_order || 0;
  updateImagePreview('topic-background', topic?.background_image);
  document.getElementById('topic-modal').classList.add('active');
}

export function closeTopicModal() {
  document.getElementById('topic-modal').classList.remove('active');
}

function editTopic(id) {
  const topic = topicsCache.find(t => t.id === id);
  openTopicModal(topic);
}

async function deleteTopic(id) {
  if (!confirm('確定要刪除此主題？')) return;
  try {
    await api.deleteTopic(id);
    showToast('主題已刪除');
    loadTopics();
  } catch (e) {
    showToast(e.message || '刪除失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('topic-id').value;
  const data = {
    name: document.getElementById('topic-name').value,
    icon: document.getElementById('topic-icon').value,
    subtitle: document.getElementById('topic-subtitle').value,
    description: document.getElementById('topic-description').value,
    background_image: document.getElementById('topic-background').value,
    sort_order: parseInt(document.getElementById('topic-sort').value)
  };

  try {
    if (id) {
      await api.updateTopic(id, data);
      showToast('主題已更新');
    } else {
      await api.createTopic(data);
      showToast('主題已新增');
    }
    closeTopicModal();
    loadTopics();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

export function initTopics() {
  document.getElementById('topic-form').addEventListener('submit', handleSubmit);
}
