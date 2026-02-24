// Dashboard Main Entry Point
import { api } from './api.js';
import { loadHomepage, initHomepage } from './homepage.js';
import { loadTopics, initTopics, openTopicModal, closeTopicModal } from './topics.js';
import { loadEvents, initEvents, openEventModal, closeEventModal } from './events.js';
import { loadBlessings, initBlessings, openBlessingModal, closeBlessingModal } from './blessings.js';
import { loadGallery, initGallery, closeGalleryModal } from './gallery.js';
import { loadBlessingTags, initBlessingTags, openBlessingTagModal, closeBlessingTagModal } from './blessing-tags.js';
import { initImagePicker, openImagePicker, closeImagePicker, confirmImageSelection, clearImageField } from './image-picker.js';
import { loadImpact, initImpact, openImpactModal, closeImpactModal } from './impact.js';
import { loadUsers, initUsers, openUserModal, closeUserModal } from './users.js';

// Section loaders map
const sectionLoaders = {
  homepage: loadHomepage,
  topics: loadTopics,
  events: loadEvents,
  blessings: loadBlessings,
  'blessing-tags': loadBlessingTags,
  gallery: loadGallery,
  impact: loadImpact,
  users: loadUsers
};

// Navigation
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;

      // Update nav active state
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update section visibility
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');

      // Load section data
      if (sectionLoaders[section]) {
        sectionLoaders[section]();
      }
    });
  });
}

// Show/hide users nav based on role
function setupUserNav() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const usersNav = document.querySelector('[data-section="users"]');
  if (usersNav) {
    usersNav.style.display = user.role === 'admin' ? '' : 'none';
  }
  // Display username in sidebar
  const usernameEl = document.getElementById('current-username');
  if (usernameEl) {
    usernameEl.textContent = user.username || '';
  }
}

// Expose functions to global scope for onclick handlers
window.openTopicModal = openTopicModal;
window.closeTopicModal = closeTopicModal;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
window.openBlessingModal = openBlessingModal;
window.closeBlessingModal = closeBlessingModal;
window.openBlessingTagModal = openBlessingTagModal;
window.closeBlessingTagModal = closeBlessingTagModal;
window.closeGalleryModal = closeGalleryModal;
window.openImpactModal = openImpactModal;
window.closeImpactModal = closeImpactModal;
window.openImagePicker = openImagePicker;
window.closeImagePicker = closeImagePicker;
window.confirmImageSelection = confirmImageSelection;
window.clearImageField = clearImageField;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Auth check
  try {
    const data = await api.checkAuth();
    localStorage.setItem('user', JSON.stringify(data.user));
  } catch {
    // authFetch already redirects on 401
    return;
  }

  setupUserNav();

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => api.logout());
  }

  initNavigation();
  initHomepage();
  initTopics();
  initEvents();
  initBlessings();
  initBlessingTags();
  initGallery();
  initImpact();
  initUsers();
  initImagePicker();

  // Load initial section
  loadHomepage();
});
