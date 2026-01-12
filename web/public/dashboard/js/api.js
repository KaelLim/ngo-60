// Dashboard API Module
const API_BASE = '/api';

export const api = {
  // Homepage
  async getHomepage() {
    const res = await fetch(`${API_BASE}/homepage`);
    return res.json();
  },

  async updateHomepage(data) {
    const res = await fetch(`${API_BASE}/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Topics
  async getTopics() {
    const res = await fetch(`${API_BASE}/topics`);
    return res.json();
  },

  async createTopic(data) {
    const res = await fetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateTopic(id, data) {
    const res = await fetch(`${API_BASE}/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteTopic(id) {
    const res = await fetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res.json();
  },

  // Events
  async getEvents() {
    const res = await fetch(`${API_BASE}/events`);
    return res.json();
  },

  async createEvent(data) {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateEvent(id, data) {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteEvent(id) {
    await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  },

  // Blessings
  async getBlessings() {
    const res = await fetch(`${API_BASE}/blessings`);
    return res.json();
  },

  async createBlessing(data) {
    const res = await fetch(`${API_BASE}/blessings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateBlessing(id, data) {
    const res = await fetch(`${API_BASE}/blessings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteBlessing(id) {
    await fetch(`${API_BASE}/blessings/${id}`, { method: 'DELETE' });
  },

  // Impact
  async getImpact() {
    const res = await fetch(`${API_BASE}/impact`);
    return res.json();
  },

  async createImpact(data) {
    const res = await fetch(`${API_BASE}/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateImpact(id, data) {
    const res = await fetch(`${API_BASE}/impact/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteImpact(id) {
    await fetch(`${API_BASE}/impact/${id}`, { method: 'DELETE' });
  },

  // Gallery
  async getGallery(category = '') {
    let url = `${API_BASE}/gallery`;
    if (category) url += `?category=${category}`;
    const res = await fetch(url);
    return res.json();
  },

  async uploadGalleryImage(file, category = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const res = await fetch(`${API_BASE}/gallery`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async updateGalleryImage(id, category) {
    const res = await fetch(`${API_BASE}/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    return res.json();
  },

  async deleteGalleryImage(id) {
    await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
  }
};
