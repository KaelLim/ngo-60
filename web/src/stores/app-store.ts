export type SheetState = 'peek' | 'preview' | 'full';
export type TabType = 'topics' | 'schedule' | 'impact';
export type PageType = 'category' | 'detail' | 'month' | 'blessing' | null;

interface AppState {
  sheetState: SheetState;
  activeTab: TabType;
  currentPage: PageType;
  selectedMonth: number;
  selectedYear: number;
  currentCategoryId: number | null;
  currentNewsId: number | null;
  currentBlessingId: number | null;
  containerY: number;
  isDragging: boolean;
}

type Listener = () => void;

export class AppStore {
  private state: AppState = {
    sheetState: 'peek',
    activeTab: 'topics',
    currentPage: null,
    selectedMonth: new Date().getMonth() + 1,
    selectedYear: new Date().getFullYear(),
    currentCategoryId: null,
    currentNewsId: null,
    currentBlessingId: null,
    containerY: 0,
    isDragging: false
  };

  private listeners = new Set<Listener>();

  // Getters
  get sheetState() { return this.state.sheetState; }
  get activeTab() { return this.state.activeTab; }
  get currentPage() { return this.state.currentPage; }
  get selectedMonth() { return this.state.selectedMonth; }
  get selectedYear() { return this.state.selectedYear; }
  get currentCategoryId() { return this.state.currentCategoryId; }
  get currentNewsId() { return this.state.currentNewsId; }
  get currentBlessingId() { return this.state.currentBlessingId; }
  get containerY() { return this.state.containerY; }
  get isDragging() { return this.state.isDragging; }

  // Setters
  setSheetState(state: SheetState) {
    this.state.sheetState = state;
    this.state.containerY = this.getSnapPosition(state);
    this.notify();
  }

  setActiveTab(tab: TabType) {
    this.state.activeTab = tab;
    this.setSheetState('full');
  }

  setCurrentPage(page: PageType) {
    this.state.currentPage = page;
    this.notify();
  }

  setSelectedMonth(month: number) {
    this.state.selectedMonth = month;
    this.notify();
  }

  setSelectedYear(year: number) {
    this.state.selectedYear = year;
    this.notify();
  }

  setCurrentCategoryId(id: number | null) {
    this.state.currentCategoryId = id;
    this.notify();
  }

  setCurrentNewsId(id: number | null) {
    this.state.currentNewsId = id;
    this.notify();
  }

  setContainerY(y: number) {
    this.state.containerY = y;
    this.notify();
  }

  setIsDragging(dragging: boolean) {
    this.state.isDragging = dragging;
    this.notify();
  }

  // Navigation helpers
  openCategory(categoryId: number, type: 'topics' | 'impact') {
    this.state.activeTab = type;
    this.state.currentCategoryId = categoryId;
    this.state.currentPage = 'category';
    this.setSheetState('full');
    this.updateURL(`/${type}/${categoryId}`);
  }

  openNewsDetail(newsId: number) {
    this.state.currentNewsId = newsId;
    this.state.currentPage = 'detail';
    this.notify();
    this.updateURL(`/${this.state.activeTab}/${this.state.currentCategoryId}/${newsId}`);
  }

  openMonth(month: number) {
    this.state.selectedMonth = month;
    this.state.currentPage = 'month';
    this.state.activeTab = 'schedule';
    this.setSheetState('full');
    this.updateURL(`/schedule/${month}`);
  }

  closePage() {
    this.state.currentPage = null;
    this.state.currentCategoryId = null;
    this.state.currentNewsId = null;
    this.notify();
    this.updateURL('/');
  }

  openBlessing(blessingId?: number) {
    this.state.currentBlessingId = blessingId || null;
    this.state.currentPage = 'blessing';
    this.notify();
  }

  closeBlessing() {
    this.state.currentPage = null;
    this.state.currentBlessingId = null;
    this.notify();
  }

  backToCategory() {
    this.state.currentPage = 'category';
    this.state.currentNewsId = null;
    this.notify();
    this.updateURL(`/${this.state.activeTab}/${this.state.currentCategoryId}`);
  }

  // Snap positions
  getSnapPosition(state: SheetState): number {
    const vh = window.innerHeight;
    switch (state) {
      case 'peek': return 0;
      case 'preview': return -(vh * 0.25);
      case 'full': return -(vh * 0.92);
    }
  }

  snapToClosestState(y: number, deltaY: number): void {
    const threshold = 50;
    const goingUp = deltaY < 0;
    const goingDown = deltaY > 0;
    const velocity = Math.abs(deltaY);

    if (velocity > threshold) {
      if (goingUp) {
        if (this.state.sheetState === 'peek') this.setSheetState('preview');
        else if (this.state.sheetState === 'preview') this.setSheetState('full');
        else this.setSheetState('full');
      } else if (goingDown) {
        if (this.state.sheetState === 'full') this.setSheetState('preview');
        else if (this.state.sheetState === 'preview') this.setSheetState('peek');
        else this.setSheetState('peek');
      }
    } else {
      this.setSheetState(this.state.sheetState);
    }
  }

  // URL handling
  private updateURL(path: string) {
    window.history.pushState({}, '', '#' + path);
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const parts = hash.split('/').filter(Boolean);

    if (parts.length === 0) {
      this.closePage();
      return;
    }

    const [section, param1, param2] = parts;

    if (section === 'topics' || section === 'impact') {
      this.state.activeTab = section;
      if (param1) {
        this.state.currentCategoryId = parseInt(param1);
        if (param2) {
          this.state.currentNewsId = parseInt(param2);
          this.state.currentPage = 'detail';
        } else {
          this.state.currentPage = 'category';
        }
      }
      this.setSheetState('full');
    } else if (section === 'schedule' && param1) {
      this.state.selectedMonth = parseInt(param1);
      this.state.activeTab = 'schedule';
      this.state.currentPage = 'month';
      this.setSheetState('full');
    }
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

export const appStore = new AppStore();
