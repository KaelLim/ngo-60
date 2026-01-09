import { api, Category, Event, News, Activity } from '../services/api.js';

export type { Category, Event, News, Activity };

type Listener = () => void;

interface DataState {
  topicCategories: Category[];
  impactCategories: Category[];
  events: Event[];
  currentNews: News[];
  currentNewsDetail: News | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

export class DataStore {
  private state: DataState = {
    topicCategories: [],
    impactCategories: [],
    events: [],
    currentNews: [],
    currentNewsDetail: null,
    activities: [],
    loading: false,
    error: null
  };

  private listeners = new Set<Listener>();

  // Getters
  get topicCategories() { return this.state.topicCategories; }
  get impactCategories() { return this.state.impactCategories; }
  get events() { return this.state.events; }
  get currentNews() { return this.state.currentNews; }
  get currentNewsDetail() { return this.state.currentNewsDetail; }
  get activities() { return this.state.activities; }
  get loading() { return this.state.loading; }
  get error() { return this.state.error; }

  // Fetch methods
  async loadCategories() {
    this.state.loading = true;
    this.notify();
    try {
      const [topics, impacts] = await Promise.all([
        api.getCategories('topic'),
        api.getCategories('impact')
      ]);
      this.state.topicCategories = topics;
      this.state.impactCategories = impacts;
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load categories';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadEvents(month?: number, year?: number) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.events = await api.getEvents(month, year);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadNewsByCategory(categoryId: number) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.currentNews = await api.getNewsByCategory(categoryId);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load news';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadNewsDetail(id: number) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.currentNewsDetail = await api.getNewsById(id);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load news detail';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadActivities(month?: number) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.activities = await api.getActivities(month);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load activities';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  getCategoryById(id: number): Category | undefined {
    return [...this.state.topicCategories, ...this.state.impactCategories]
      .find(c => c.id === id);
  }

  // Subscribe
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const dataStore = new DataStore();
