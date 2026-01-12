// Homepage Module
import { api } from './api.js';
import { showToast } from './toast.js';

export async function loadHomepage() {
  try {
    const data = await api.getHomepage();
    if (data) {
      document.getElementById('homepage-slogan').value = data.slogan || '';
      document.getElementById('homepage-title').value = data.title || '';
      document.getElementById('homepage-content').value = data.content || '';
      updateHomepagePreview();
    }
  } catch (e) {
    console.error('Failed to load homepage:', e);
  }
}

function updateHomepagePreview() {
  const slogan = document.getElementById('homepage-slogan').value;
  const title = document.getElementById('homepage-title').value;
  const content = document.getElementById('homepage-content').value;

  document.getElementById('preview-slogan').innerHTML = slogan.split(' ').map(w => `<div>${w}</div>`).join('');
  document.getElementById('preview-title').textContent = title || '標題';
  document.getElementById('preview-content').textContent = content || '內容預覽';
}

async function handleSubmit(e) {
  e.preventDefault();
  try {
    await api.updateHomepage({
      slogan: document.getElementById('homepage-slogan').value,
      title: document.getElementById('homepage-title').value,
      content: document.getElementById('homepage-content').value
    });
    showToast('首頁內容已更新');
  } catch (e) {
    showToast('更新失敗', 'error');
  }
}

export function initHomepage() {
  document.getElementById('homepage-slogan').addEventListener('input', updateHomepagePreview);
  document.getElementById('homepage-title').addEventListener('input', updateHomepagePreview);
  document.getElementById('homepage-content').addEventListener('input', updateHomepagePreview);
  document.getElementById('homepage-form').addEventListener('submit', handleSubmit);
}
