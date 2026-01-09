const API_BASE = import.meta.env.VITE_API_URL || '/api';

export interface Category {
  id: number;
  name: string;
  icon: string;
  type: 'topic' | 'impact';
  sort_order: number;
}

export interface Event {
  id: number;
  title: string;
  date_start: string;
  date_end: string | null;
  tag: string | null;
  icon: string | null;
  month: number;
  year: number;
  image_url: string | null;
}

export interface News {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  icon: string | null;
  category_id: number | null;
  published_at: string;
  image_url: string | null;
}

export interface Activity {
  id: number;
  title: string;
  date_label: string;
  location: string | null;
  month: number;
}

export interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
  mime_type: string | null;
  uploaded_at: string;
  is_active: boolean;
}

export interface Homepage {
  id: number;
  slogan: string | null;
  title: string | null;
  content: string | null;
  updated_at: string;
}

export const api = {
  async getCategories(type: 'topic' | 'impact'): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories?type=${type}`);
    return res.json();
  },

  async getCategoryById(id: number): Promise<Category | null> {
    const res = await fetch(`${API_BASE}/categories/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getEvents(month?: number, year?: number): Promise<Event[]> {
    let url = `${API_BASE}/events`;
    const params = new URLSearchParams();
    if (month) params.set('month', month.toString());
    if (year) params.set('year', year.toString());
    if (params.toString()) url += `?${params}`;
    const res = await fetch(url);
    return res.json();
  },

  async getNewsByCategory(categoryId: number): Promise<News[]> {
    const res = await fetch(`${API_BASE}/news?category_id=${categoryId}`);
    return res.json();
  },

  async getNewsById(id: number): Promise<News | null> {
    const res = await fetch(`${API_BASE}/news/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getActivities(month?: number): Promise<Activity[]> {
    let url = `${API_BASE}/activities`;
    if (month) url += `?month=${month}`;
    const res = await fetch(url);
    return res.json();
  },

  // Gallery
  async getGalleryRandom(count: number = 15): Promise<GalleryImage[]> {
    const res = await fetch(`${API_BASE}/gallery/random?count=${count}`);
    return res.json();
  },

  async getGalleryAll(): Promise<GalleryImage[]> {
    const res = await fetch(`${API_BASE}/gallery`);
    return res.json();
  },

  async uploadGalleryImage(file: File): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/gallery`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async deleteGalleryImage(id: number): Promise<void> {
    await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
  },

  getGalleryImageUrl(filename: string): string {
    return `/uploads/gallery/${filename}`;
  },

  // Homepage
  async getHomepage(): Promise<Homepage | null> {
    const res = await fetch(`${API_BASE}/homepage`);
    if (!res.ok) return null;
    return res.json();
  },

  async updateHomepage(data: Partial<Homepage>): Promise<Homepage> {
    const res = await fetch(`${API_BASE}/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
