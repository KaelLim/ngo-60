import { api, Topic, Event, ImpactSection, Blessing } from '../services/api.js';

export type { Topic, Event, ImpactSection, Blessing };

type Listener = () => void;

interface DataState {
  topics: Topic[];
  impactSections: ImpactSection[];
  events: Event[];
  blessings: Blessing[];
  loading: boolean;
  error: string | null;
}

export class DataStore {
  private state: DataState = {
    topics: [],
    impactSections: [],
    events: [],
    blessings: [],
    loading: false,
    error: null
  };

  private listeners = new Set<Listener>();

  // Getters
  get topics() { return this.state.topics; }
  get impactSections() { return this.state.impactSections; }
  get events() { return this.state.events; }
  get blessings() { return this.state.blessings; }
  get loading() { return this.state.loading; }
  get error() { return this.state.error; }

  // Fetch methods
  async loadTopics() {
    this.state.loading = true;
    this.notify();
    try {
      this.state.topics = await api.getTopics();
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load topics';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadImpactSections() {
    this.state.loading = true;
    this.notify();
    try {
      this.state.impactSections = await api.getImpactSections();
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load impact sections';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadEvents(params?: { month?: number; year?: number; topic_id?: number }) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.events = await api.getEvents(params);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load events';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadBlessings(featured?: boolean) {
    this.state.loading = true;
    this.notify();
    try {
      this.state.blessings = await api.getBlessings(featured);
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load blessings';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadAllData(month?: number, year?: number) {
    this.state.loading = true;
    this.notify();
    try {
      const [topics, events, impactSections, blessings] = await Promise.all([
        api.getTopics(),
        api.getEvents({ month, year }),
        api.getImpactSections(),
        api.getBlessings(true)
      ]);
      this.state.topics = topics;
      this.state.events = events;
      this.state.impactSections = impactSections;
      this.state.blessings = blessings;
      this.state.error = null;
    } catch (e) {
      this.state.error = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  getTopicById(id: number): Topic | undefined {
    return this.state.topics.find(t => t.id === id);
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
