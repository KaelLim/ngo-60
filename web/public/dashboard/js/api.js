// Dashboard API Module
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders(extra = {}) {
  const headers = { ...extra };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function authFetch(url, options = {}) {
  options.headers = authHeaders(options.headers || {});
  const res = await fetch(url, options);
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/dashboard/login.html';
    throw new Error('未授權');
  }
  return res;
}

export const api = {
  // Auth
  async checkAuth() {
    const res = await authFetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/dashboard/login.html';
  },

  // Homepage
  async getHomepage() {
    const res = await authFetch(`${API_BASE}/homepage`);
    return res.json();
  },

  async updateHomepage(data) {
    const res = await authFetch(`${API_BASE}/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Topics
  async getTopics() {
    const res = await authFetch(`${API_BASE}/topics`);
    return res.json();
  },

  async createTopic(data) {
    const res = await authFetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateTopic(id, data) {
    const res = await authFetch(`${API_BASE}/topics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteTopic(id) {
    const res = await authFetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    return res.json();
  },

  // Events
  async getEvents(includeUnpublished = false) {
    const url = includeUnpublished ? `${API_BASE}/events?all=true` : `${API_BASE}/events`;
    const res = await authFetch(url);
    return res.json();
  },

  async createEvent(data) {
    const res = await authFetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateEvent(id, data) {
    const res = await authFetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteEvent(id) {
    await authFetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
  },

  // Blessings
  async getBlessings() {
    const res = await authFetch(`${API_BASE}/blessings`);
    return res.json();
  },

  async createBlessing(data) {
    const res = await authFetch(`${API_BASE}/blessings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateBlessing(id, data) {
    const res = await authFetch(`${API_BASE}/blessings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteBlessing(id) {
    await authFetch(`${API_BASE}/blessings/${id}`, { method: 'DELETE' });
  },

  // Impact
  async getImpact() {
    const res = await authFetch(`${API_BASE}/impact`);
    return res.json();
  },

  async createImpact(data) {
    const res = await authFetch(`${API_BASE}/impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateImpact(id, data) {
    const res = await authFetch(`${API_BASE}/impact/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteImpact(id) {
    await authFetch(`${API_BASE}/impact/${id}`, { method: 'DELETE' });
  },

  // Impact Config
  async getImpactConfig() {
    const res = await authFetch(`${API_BASE}/impact-config`);
    return res.json();
  },

  async updateImpactConfig(data) {
    const res = await authFetch(`${API_BASE}/impact-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Gallery
  async getGallery(category = '') {
    let url = `${API_BASE}/gallery`;
    if (category) url += `?category=${category}`;
    const res = await authFetch(url);
    return res.json();
  },

  async uploadGalleryImage(file, category = 'general', onProgress = null) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const xhr = new XMLHttpRequest();

      // 進度追蹤
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/dashboard/login.html';
          reject(new Error('未授權'));
          return;
        }
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error || '上傳失敗'));
          }
        } catch (e) {
          reject(new Error('伺服器回應錯誤'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('網路錯誤'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('上傳已取消'));
      });

      xhr.open('POST', `${API_BASE}/gallery`);
      const token = getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  async updateGalleryImage(id, category) {
    const res = await authFetch(`${API_BASE}/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    return res.json();
  },

  async deleteGalleryImage(id) {
    await authFetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
  },

  // Blessing Tags
  async getBlessingTags() {
    const res = await authFetch(`${API_BASE}/blessing-tags`);
    return res.json();
  },

  async createBlessingTag(data) {
    const res = await authFetch(`${API_BASE}/blessing-tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateBlessingTag(id, data) {
    const res = await authFetch(`${API_BASE}/blessing-tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteBlessingTag(id) {
    await authFetch(`${API_BASE}/blessing-tags/${id}`, { method: 'DELETE' });
  },

  // Users
  async getUsers() {
    const res = await authFetch(`${API_BASE}/users`);
    return res.json();
  },

  async createUser(data) {
    const res = await authFetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  async updateUser(id, data) {
    const res = await authFetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  },

  async deleteUser(id) {
    const res = await authFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    return res.json();
  }
};
