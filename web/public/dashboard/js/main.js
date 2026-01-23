// Dashboard Main Entry Point
import { loadHomepage, initHomepage } from './homepage.js';
import { loadTopics, initTopics, openTopicModal, closeTopicModal } from './topics.js';
import { loadEvents, initEvents, openEventModal, closeEventModal } from './events.js';
import { loadBlessings, initBlessings, openBlessingModal, closeBlessingModal } from './blessings.js';
import { loadGallery, initGallery, closeGalleryModal } from './gallery.js';
import { loadBlessingTags, initBlessingTags, openBlessingTagModal, closeBlessingTagModal } from './blessing-tags.js';
import { initImagePicker, openImagePicker, closeImagePicker, confirmImageSelection, clearImageField } from './image-picker.js';

// Section loaders map
const sectionLoaders = {
  homepage: loadHomepage,
  topics: loadTopics,
  events: loadEvents,
  blessings: loadBlessings,
  'blessing-tags': loadBlessingTags,
  gallery: loadGallery
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
window.openImagePicker = openImagePicker;
window.closeImagePicker = closeImagePicker;
window.confirmImageSelection = confirmImageSelection;
window.clearImageField = clearImageField;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHomepage();
  initTopics();
  initEvents();
  initBlessings();
  initBlessingTags();
  initGallery();
  initImagePicker();

  // Load initial section
  loadHomepage();
});
