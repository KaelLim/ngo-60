// Gallery Module
import { api } from './api.js';
import { showToast } from './toast.js';

let galleryCache = [];
let selectMode = false;
let selectedIds = new Set();

const CATEGORY_LABELS = {
  'homepage': '首頁',
  'events': '活動',
  'topics': '主題',
  'blessings': '祝福語',
  'general': '一般'
};

export async function loadGallery() {
  try {
    const filter = document.getElementById('gallery-filter').value;
    galleryCache = await api.getGallery(filter);
    renderGalleryGrid();
  } catch (e) {
    console.error('Failed to load gallery:', e);
  }
}

function renderGalleryGrid() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = galleryCache.map(img => `
    <div class="gallery-item${selectedIds.has(img.id) ? ' selected' : ''}" data-id="${img.id}">
      <img src="/uploads/gallery/${img.filename}" alt="${img.original_name || ''}">
      <div class="overlay">
        <span class="category-badge">${CATEGORY_LABELS[img.category] || img.category}</span>
      </div>
    </div>
  `).join('');

  // Add click listeners
  grid.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => handleItemClick(parseInt(item.dataset.id)));
  });
}

function handleItemClick(id) {
  if (selectMode) {
    toggleSelection(id);
  } else {
    openGalleryModal(id);
  }
}

function toggleSelection(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  // Update selected count
  document.getElementById('gallery-selected-count').textContent = `${selectedIds.size} 張已選`;

  // Update item visual states
  document.querySelectorAll('#gallery-grid .gallery-item').forEach(item => {
    const id = parseInt(item.dataset.id);
    item.classList.toggle('selected', selectedIds.has(id));
  });
}

function enterSelectMode() {
  selectMode = true;
  selectedIds.clear();
  document.getElementById('gallery-grid').classList.add('select-mode');
  document.getElementById('gallery-batch-actions').style.display = 'flex';
  document.getElementById('gallery-select-mode-btn').style.display = 'none';
  updateSelectionUI();
}

function exitSelectMode() {
  selectMode = false;
  selectedIds.clear();
  document.getElementById('gallery-grid').classList.remove('select-mode');
  document.getElementById('gallery-batch-actions').style.display = 'none';
  document.getElementById('gallery-select-mode-btn').style.display = '';
  updateSelectionUI();
}

async function batchUpdateCategory() {
  if (selectedIds.size === 0) {
    showToast('請先選擇圖片', 'error');
    return;
  }

  const category = document.getElementById('batch-category').value;
  const ids = Array.from(selectedIds);

  try {
    for (const id of ids) {
      await api.updateGalleryImage(id, category);
    }
    showToast(`${ids.length} 張圖片分類已更新`);
    exitSelectMode();
    loadGallery();
  } catch (e) {
    showToast('批次更新失敗', 'error');
  }
}

async function batchDelete() {
  if (selectedIds.size === 0) {
    showToast('請先選擇圖片', 'error');
    return;
  }

  if (!confirm(`確定要刪除 ${selectedIds.size} 張圖片？`)) return;

  const ids = Array.from(selectedIds);

  try {
    for (const id of ids) {
      await api.deleteGalleryImage(id);
    }
    showToast(`${ids.length} 張圖片已刪除`);
    exitSelectMode();
    loadGallery();
  } catch (e) {
    showToast('批次刪除失敗', 'error');
  }
}

function openGalleryModal(id) {
  const img = galleryCache.find(i => i.id === id);
  document.getElementById('gallery-edit-id').value = img.id;
  document.getElementById('gallery-edit-preview').src = `/uploads/gallery/${img.filename}`;
  document.getElementById('gallery-edit-category').value = img.category || 'general';
  document.getElementById('gallery-modal').classList.add('active');
}

export function closeGalleryModal() {
  document.getElementById('gallery-modal').classList.remove('active');
}

async function handleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('gallery-edit-id').value;
  const category = document.getElementById('gallery-edit-category').value;

  try {
    await api.updateGalleryImage(id, category);
    showToast('圖片分類已更新');
    closeGalleryModal();
    loadGallery();
  } catch (e) {
    showToast('更新失敗', 'error');
  }
}

async function deleteGalleryImage() {
  if (!confirm('確定要刪除此圖片？')) return;
  const id = document.getElementById('gallery-edit-id').value;
  try {
    await api.deleteGalleryImage(id);
    showToast('圖片已刪除');
    closeGalleryModal();
    loadGallery();
  } catch (e) {
    showToast('刪除失敗', 'error');
  }
}

async function uploadFiles(files) {
  const category = document.getElementById('upload-category').value || 'general';
  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress-bar');
  const progressText = document.getElementById('upload-progress-text');

  let successCount = 0;
  let failCount = 0;
  const totalFiles = files.length;

  // 顯示進度條
  progressContainer.style.display = 'block';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    progressText.textContent = `上傳中 (${i + 1}/${totalFiles}): ${file.name}`;

    try {
      await api.uploadGalleryImage(file, category, (percent) => {
        // 計算總體進度：已完成的檔案 + 當前檔案進度
        const overallPercent = Math.round(((i + percent / 100) / totalFiles) * 100);
        progressBar.style.width = `${overallPercent}%`;
      });
      successCount++;
    } catch (e) {
      console.error('Upload failed:', e);
      failCount++;
      showToast(`${file.name}: ${e.message}`, 'error');
    }
  }

  // 隱藏進度條
  progressContainer.style.display = 'none';
  progressBar.style.width = '0%';

  // 顯示結果
  if (failCount === 0) {
    showToast(`${successCount} 張圖片上傳成功`);
  } else if (successCount === 0) {
    showToast(`全部 ${failCount} 張圖片上傳失敗`, 'error');
  } else {
    showToast(`${successCount} 張成功，${failCount} 張失敗`, 'warning');
  }

  loadGallery();
}

export function initGallery() {
  const uploadZone = document.getElementById('upload-zone');
  const uploadInput = document.getElementById('gallery-upload');

  uploadZone.addEventListener('click', () => uploadInput.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
  });

  uploadZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    await uploadFiles(e.dataTransfer.files);
  });

  uploadInput.addEventListener('change', async () => {
    await uploadFiles(uploadInput.files);
    uploadInput.value = '';
  });

  document.getElementById('gallery-form').addEventListener('submit', handleSubmit);
  document.getElementById('gallery-delete-btn').addEventListener('click', deleteGalleryImage);
  document.getElementById('gallery-filter').addEventListener('change', loadGallery);

  // Multi-select mode event listeners
  document.getElementById('gallery-select-mode-btn').addEventListener('click', enterSelectMode);
  document.getElementById('gallery-cancel-select-btn').addEventListener('click', exitSelectMode);
  document.getElementById('batch-update-btn').addEventListener('click', batchUpdateCategory);
  document.getElementById('batch-delete-btn').addEventListener('click', batchDelete);
}
