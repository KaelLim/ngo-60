// Image Picker Module
import { api } from './api.js';

let targetField = null;
let selectedImage = null;
let galleryCache = [];

export function openImagePicker(fieldId, defaultCategory = '') {
  targetField = fieldId;
  selectedImage = null;

  // Set active category tab
  document.querySelectorAll('.picker-category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === defaultCategory);
  });

  loadPickerGallery(defaultCategory);
  document.getElementById('image-picker-modal').classList.add('active');
}

export function closeImagePicker() {
  document.getElementById('image-picker-modal').classList.remove('active');
  targetField = null;
  selectedImage = null;
}

async function loadPickerGallery(category = '') {
  try {
    galleryCache = await api.getGallery(category);
    renderPickerGallery();
  } catch (e) {
    console.error('Failed to load picker gallery:', e);
  }
}

function renderPickerGallery() {
  const grid = document.getElementById('picker-gallery-grid');
  if (galleryCache.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>此分類沒有圖片</p></div>';
    return;
  }

  grid.innerHTML = galleryCache.map(img => `
    <div class="picker-gallery-item ${selectedImage === img.id ? 'selected' : ''}"
         data-id="${img.id}">
      <img src="/uploads/gallery/${img.filename}" alt="${img.original_name || ''}">
    </div>
  `).join('');

  // Add click listeners
  grid.querySelectorAll('.picker-gallery-item').forEach(item => {
    item.addEventListener('click', () => selectPickerImage(parseInt(item.dataset.id)));
  });
}

function selectPickerImage(id) {
  selectedImage = id;
  document.querySelectorAll('.picker-gallery-item').forEach(item => {
    item.classList.toggle('selected', parseInt(item.dataset.id) === id);
  });
}

export function confirmImageSelection() {
  if (!selectedImage || !targetField) {
    closeImagePicker();
    return;
  }

  const img = galleryCache.find(i => i.id === selectedImage);
  if (!img) {
    closeImagePicker();
    return;
  }

  const imageUrl = `/uploads/gallery/${img.filename}`;

  // Set the hidden input value
  document.getElementById(targetField).value = imageUrl;

  // Update the preview
  updateImagePreview(targetField, imageUrl);

  closeImagePicker();
}

export function clearImageField(fieldId) {
  document.getElementById(fieldId).value = '';
  updateImagePreview(fieldId, null);
}

export function updateImagePreview(fieldId, imageUrl) {
  const previewContainer = document.getElementById(`${fieldId}-preview`);
  if (previewContainer && imageUrl) {
    previewContainer.innerHTML = `<img src="${imageUrl}" alt="">`;
  } else if (previewContainer) {
    previewContainer.innerHTML = '<span class="placeholder"><span class="material-symbols-outlined">image</span></span>';
  }
}

// Initialize category tab clicks
export function initImagePicker() {
  document.querySelectorAll('.picker-category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.picker-category-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadPickerGallery(tab.dataset.category);
    });
  });
}
