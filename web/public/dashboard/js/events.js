// Events Module
import { api } from './api.js';
import { showToast } from './toast.js';
import { updateImagePreview } from './image-picker.js';
import { getTopicsCache, loadTopics } from './topics.js';

let eventsCache = [];
let currentSort = { field: 'created_at', direction: 'desc' };

export async function loadEvents() {
  try {
    // Ensure topics are loaded for the dropdown
    let topicsCache = getTopicsCache();
    if (topicsCache.length === 0) {
      await loadTopics();
      topicsCache = getTopicsCache();
    }
    topicsCacheRef = topicsCache;
    updateEventTopicSelect(topicsCache);

    // Load all events including unpublished for dashboard
    eventsCache = await api.getEvents(true);
    renderEventsTable(topicsCache);
  } catch (e) {
    console.error('Failed to load events:', e);
  }
}

function updateEventTopicSelect(topicsCache) {
  const select = document.getElementById('event-topic');
  select.innerHTML = '<option value="">-- 無關聯 --</option>' +
    topicsCache.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('');
}

// 將時間戳轉換為 MM/DD/YYYY 格式
function formatDateTimeForDisplay(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function sortEvents(events, field, direction) {
  return [...events].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Handle null values
    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';

    // Handle dates
    if (field === 'created_at' || field === 'updated_at' || field === 'date_start') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    }

    // Handle month/year combination
    if (field === 'month') {
      valA = a.year * 100 + a.month;
      valB = b.year * 100 + b.month;
    }

    // Compare
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll('th.sortable').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === currentSort.field) {
      th.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });
}

function renderEventsTable(topicsCache) {
  const tbody = document.getElementById('events-table');
  const sortedEvents = sortEvents(eventsCache, currentSort.field, currentSort.direction);
  updateSortIndicators();

  tbody.innerHTML = sortedEvents.map(e => {
    const topic = topicsCache.find(t => t.id === e.topic_id);
    const publishedToggle = e.published
      ? `<button class="badge-toggle badge-toggle-on" data-action="toggle-publish" data-id="${e.id}" data-published="true" title="點擊取消發布">已發布</button>`
      : `<button class="badge-toggle badge-toggle-off" data-action="toggle-publish" data-id="${e.id}" data-published="false" title="點擊發布">草稿</button>`;
    return `
      <tr class="${e.published ? '' : 'row-draft'}">
        <td>${formatDateTimeForDisplay(e.created_at)}</td>
        <td>${formatDateTimeForDisplay(e.updated_at)}</td>
        <td>${e.month}月 / ${e.year}</td>
        <td>${e.title}</td>
        <td>${formatDateForInput(e.date_start)}${e.date_end ? ' ~ ' + formatDateForInput(e.date_end) : ''}</td>
        <td>${e.participation_type || '-'}</td>
        <td>${topic ? topic.icon + ' ' + topic.name : '-'}</td>
        <td>${publishedToggle}</td>
        <td class="actions">
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${e.id}">編輯</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${e.id}">刪除</button>
        </td>
      </tr>
    `;
  }).join('');

  // Add event listeners
  tbody.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => editEvent(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteEvent(parseInt(btn.dataset.id)));
  });
  tbody.querySelectorAll('[data-action="toggle-publish"]').forEach(btn => {
    btn.addEventListener('click', () => togglePublish(parseInt(btn.dataset.id), btn.dataset.published === 'true'));
  });
}

// 將 ISO 日期字串轉換為 YYYY-MM-DD 格式
function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  // 處理 ISO 格式 (2026-01-28T00:00:00.000Z) 或一般格式
  return dateStr.split('T')[0];
}

export function openEventModal(event = null) {
  document.getElementById('event-modal-title').textContent = event ? '編輯活動' : '新增活動';
  document.getElementById('event-id').value = event?.id || '';
  document.getElementById('event-title').value = event?.title || '';
  document.getElementById('event-description').value = event?.description || '';
  document.getElementById('event-date-start').value = formatDateForInput(event?.date_start);
  document.getElementById('event-date-end').value = formatDateForInput(event?.date_end);
  document.getElementById('event-topic').value = event?.topic_id || '';
  document.getElementById('event-month').value = event?.month || new Date().getMonth() + 1;
  document.getElementById('event-year').value = event?.year || 2026;
  document.getElementById('event-sort').value = event?.sort_order || 0;
  document.getElementById('event-participation').value = event?.participation_type || '';
  document.getElementById('event-image').value = event?.image_url || '';
  document.getElementById('event-link').value = event?.link_url || '';
  document.getElementById('event-published').checked = event?.published ?? true;
  updateImagePreview('event-image', event?.image_url);
  document.getElementById('event-modal').classList.add('active');
}

export function closeEventModal() {
  document.getElementById('event-modal').classList.remove('active');
}

function editEvent(id) {
  const event = eventsCache.find(e => e.id === id);
  openEventModal(event);
}

async function deleteEvent(id) {
  if (!confirm('確定要刪除此活動？')) return;
  try {
    await api.deleteEvent(id);
    showToast('活動已刪除');
    loadEvents();
  } catch (e) {
    showToast('刪除失敗', 'error');
  }
}

async function togglePublish(id, currentPublished) {
  try {
    await api.updateEvent(id, { published: !currentPublished });
    showToast(currentPublished ? '已設為草稿' : '已發布');
    loadEvents();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('event-id').value;
  const topicValue = document.getElementById('event-topic').value;
  const data = {
    title: document.getElementById('event-title').value,
    description: document.getElementById('event-description').value,
    date_start: document.getElementById('event-date-start').value,
    date_end: document.getElementById('event-date-end').value || null,
    topic_id: topicValue ? parseInt(topicValue) : null,
    month: parseInt(document.getElementById('event-month').value),
    year: parseInt(document.getElementById('event-year').value),
    sort_order: parseInt(document.getElementById('event-sort').value),
    participation_type: document.getElementById('event-participation').value,
    image_url: document.getElementById('event-image').value,
    link_url: document.getElementById('event-link').value || null,
    published: document.getElementById('event-published').checked
  };

  try {
    if (id) {
      await api.updateEvent(id, data);
      showToast('活動已更新');
    } else {
      await api.createEvent(data);
      showToast('活動已新增');
    }
    closeEventModal();
    loadEvents();
  } catch (e) {
    showToast('操作失敗', 'error');
  }
}

let topicsCacheRef = [];

export function initEvents() {
  document.getElementById('event-form').addEventListener('submit', handleSubmit);

  // Add sort listeners to table headers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
      }
      renderEventsTable(topicsCacheRef);
    });
  });
}

export function setTopicsCache(topics) {
  topicsCacheRef = topics;
}
