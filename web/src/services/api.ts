const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================
// 介面定義
// =============================================

export interface Topic {
  id: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  background_image: string | null;
  sort_order: number;
}

export interface TopicWithEvents extends Topic {
  events: Event[];
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  participation_type: string | null;
  image_url: string | null;
  topic_id: number | null;
  month: number;
  year: number;
  sort_order: number;
}

export interface ImpactSection {
  id: number;
  name: string;
  icon: string;
  stat_value: string | null;
  stat_label: string | null;
  sort_order: number;
}

export interface Blessing {
  id: number;
  author: string;
  message: string;
  full_content: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
}

export interface GalleryImage {
  id: number;
  filename: string;
  original_name: string | null;
  mime_type: string | null;
  category: string | null;
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

// =============================================
// API 方法
// =============================================

export const api = {
  // Topics (主題)
  async getTopics(): Promise<Topic[]> {
    const res = await fetch(`${API_BASE}/topics`);
    return res.json();
  },

  async getTopicById(id: number): Promise<TopicWithEvents | null> {
    const res = await fetch(`${API_BASE}/topics/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Events (活動/時程)
  async getEvents(params?: { month?: number; year?: number; topic_id?: number }): Promise<Event[]> {
    let url = `${API_BASE}/events`;
    const searchParams = new URLSearchParams();
    if (params?.month) searchParams.set('month', params.month.toString());
    if (params?.year) searchParams.set('year', params.year.toString());
    if (params?.topic_id) searchParams.set('topic_id', params.topic_id.toString());
    if (searchParams.toString()) url += `?${searchParams}`;
    const res = await fetch(url);
    return res.json();
  },

  async getEventById(id: number): Promise<Event | null> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Impact (影響力)
  async getImpactSections(): Promise<ImpactSection[]> {
    const res = await fetch(`${API_BASE}/impact`);
    return res.json();
  },

  // Blessings (祝福語)
  async getBlessings(featured?: boolean): Promise<Blessing[]> {
    let url = `${API_BASE}/blessings`;
    if (featured) url += '?featured=true';
    const res = await fetch(url);
    return res.json();
  },

  async getBlessingById(id: number): Promise<Blessing | null> {
    const res = await fetch(`${API_BASE}/blessings/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Gallery (圖庫)
  async getGalleryRandom(count: number = 15, category?: string): Promise<GalleryImage[]> {
    let url = `${API_BASE}/gallery/random?count=${count}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    return res.json();
  },

  async getGalleryAll(category?: string): Promise<GalleryImage[]> {
    let url = `${API_BASE}/gallery`;
    if (category) url += `?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    return res.json();
  },

  async uploadGalleryImage(file: File, category: string = 'general'): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const res = await fetch(`${API_BASE}/gallery`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  async updateGalleryImage(id: number, category: string): Promise<GalleryImage> {
    const res = await fetch(`${API_BASE}/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    return res.json();
  },

  async deleteGalleryImage(id: number): Promise<void> {
    await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
  },

  getGalleryImageUrl(filename: string): string {
    return `/uploads/gallery/${filename}`;
  },

  // Homepage (首頁)
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
