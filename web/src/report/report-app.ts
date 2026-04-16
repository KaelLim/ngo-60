import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

interface ApiChapter {
  chapter_id: string;
  title: string;
  sort_order: number;
}

interface ApiPage {
  chapter_id: string;
  page_id: string;
  title: string;
  content: string;
  sort_order: number;
}

// Topic card descriptions for the overview page
const chapterMeta: Record<string, { subtitle: string }> = {
  environment: { subtitle: '守護萬物與大地' },
  community: { subtitle: '安穩家園美善社區' },
  humanitarian: { subtitle: '聞聲救苦拔苦予樂' },
};

const contentCache = new Map<string, string>();

/** Detect if content is markdown (starts with # or has ## patterns) */
function isMarkdown(content: string): boolean {
  return /^#{1,4}\s/m.test(content);
}

async function fetchContent(chapterId: string, pageId: string): Promise<string> {
  const key = `${chapterId}/${pageId}`;
  if (contentCache.has(key)) return contentCache.get(key)!;

  try {
    // Try single "main" page first (new format)
    const res = await fetch(`/api/report-pages/${chapterId}/${pageId}`);
    if (res.ok) {
      const data = await res.json();
      let content = data.content || '';
      // If content is markdown, convert to HTML using marked
      if (content && isMarkdown(content)) {
        const { marked } = await import('marked');
        content = marked.parse(content, { async: false }) as string;
      }
      contentCache.set(key, content);
      return content;
    }

    // Fallback: fetch all pages for the chapter and merge (old multi-page format)
    const allRes = await fetch(`/api/report-pages/${chapterId}`);
    if (!allRes.ok) return '';
    const pages = await allRes.json();
    if (!pages || pages.length === 0) return '';

    let merged = '';
    for (const pg of pages) {
      let pgContent = pg.content || '';
      // Fetch full content if not included
      if (!pgContent) {
        try {
          const pgRes = await fetch(`/api/report-pages/${chapterId}/${pg.page_id}`);
          if (pgRes.ok) {
            const pgData = await pgRes.json();
            pgContent = pgData.content || '';
          }
        } catch { /* skip */ }
      }
      if (pgContent) merged += pgContent + '\n\n';
    }

    // Convert markdown to HTML if needed
    if (merged && isMarkdown(merged)) {
      const { marked } = await import('marked');
      merged = marked.parse(merged, { async: false }) as string;
    }

    contentCache.set(key, merged);
    return merged;
  } catch {
    return '';
  }
}



@customElement('report-app')
export class ReportApp extends LitElement {
  @state() private chapters: ApiChapter[] = [];
  @state() private activeChapterId = '';
  @state() private sidebarOpen = false;
  @state() private activeTocId = '';
  @state() private currentContent = '';
  @state() private loading = true;

  private get activeChapter(): ApiChapter | undefined {
    return this.chapters.find(c => c.chapter_id === this.activeChapterId);
  }

  private get renderedContent(): string {
    const content = this.currentContent;
    if (!content) return '';
    // Use DOMParser to add ids to headings (handles HTML entities like &mdash; correctly)
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const headings = this.sidebarHeadings;
    let hIndex = 0;
    doc.querySelectorAll('h1, h2, h3').forEach((el) => {
      const text = (el.textContent || '').trim();
      const match = headings.find(h => h.text === text);
      if (match) {
        el.id = match.id;
      }
    });
    return doc.body.innerHTML;
  }


  /** Extract H1 + H2 + H3 headings for sidebar navigation */
  private get sidebarHeadings(): { id: string; text: string; level: number }[] {
    const headings: { id: string; text: string; level: number }[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.currentContent, 'text/html');
    doc.querySelectorAll('h1, h2, h3').forEach((el) => {
      const text = (el.textContent || '').trim();
      const level = el.tagName === 'H1' ? 1 : el.tagName === 'H2' ? 2 : 3;
      const id = `h${level}-` + text.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '').toLowerCase();
      headings.push({ id, text, level });
    });
    return headings;
  }

  private get topicChapters() {
    return this.chapters.filter(c => c.chapter_id in chapterMeta);
  }

  private get isAboutOverview(): boolean {
    return this.activeChapterId === 'about';
  }

  async connectedCallback() {
    super.connectedCallback();
    try {
      const res = await fetch('/api/report-pages/chapters');
      this.chapters = await res.json();
    } catch {
      this.chapters = [];
    }
    if (this.chapters.length > 0) {
      this.activeChapterId = this.chapters[0].chapter_id;
      this.loadFromHash();
    }
    this.loading = false;
    window.addEventListener('hashchange', () => this.loadFromHash());
  }

  private async loadFromHash() {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const ch = this.chapters.find(c => c.chapter_id === hash);
      if (ch) {
        this.activeChapterId = ch.chapter_id;
      }
    }
    await this.loadContent();
  }

  private async loadContent() {
    this.loading = true;

    this.currentContent = await fetchContent(this.activeChapterId, 'main');
    this.loading = false;
  }

  private async selectChapter(chId: string) {
    this.activeChapterId = chId;
    location.hash = chId;
    this.sidebarOpen = false;
    this.scrollContentTop();
    await this.loadContent();
  }

  private scrollContentTop() {
    requestAnimationFrame(() => {
      this.shadowRoot?.querySelector('.content')?.scrollTo(0, 0);
      this.shadowRoot?.querySelector('.body')?.scrollTo(0, 0);
    });
  }

  private scrollToHeading(id: string) {
    this.activeTocId = id;
    this._scrollingToHeading = true;
    const isMobile = window.innerWidth <= 960;
    const scrollEl = this.shadowRoot?.querySelector('.content');
    const contentInner = this.shadowRoot?.querySelector('.content-inner');
    const el = contentInner?.querySelector(`#${id}`);
    if (el && scrollEl) {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const containerRect = scrollEl.getBoundingClientRect();
      const offset = 16;
      const top = scrollEl.scrollTop + rect.top - containerRect.top - offset;
      scrollEl.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { this._scrollingToHeading = false; }, 600);
    }

    // Mobile: auto-scroll pills rows to center active pill
    if (isMobile) {
      setTimeout(() => {
        // Center active H2 pill
        const activeH2 = this.shadowRoot?.querySelector('.pills-row .pill.active') as HTMLElement;
        if (activeH2) {
          const row = activeH2.closest('.pills-row') as HTMLElement;
          if (row) {
            const pillCenter = activeH2.offsetLeft + activeH2.offsetWidth / 2;
            row.scrollTo({ left: pillCenter - row.clientWidth / 2, behavior: 'smooth' });
          }
        }
        // Center active H3 pill
        const activeH3 = this.shadowRoot?.querySelector('.pills-h3-row .pill-h3.active') as HTMLElement;
        if (activeH3) {
          const row = activeH3.closest('.pills-h3-row') as HTMLElement;
          if (row) {
            const pillCenter = activeH3.offsetLeft + activeH3.offsetWidth / 2;
            row.scrollTo({ left: pillCenter - row.clientWidth / 2, behavior: 'smooth' });
          }
        }
      }, 150);
    }
  }

  private _scrollingToHeading = false;
  private _scrollObserver: any = null;

  updated() {
    this.setupScrollSpy();
  }

  private _scrollTarget: Element | null = null;

  private setupScrollSpy() {
    const content = this.shadowRoot?.querySelector('.content');
    const contentInner = this.shadowRoot?.querySelector('.content-inner');
    const body = this.shadowRoot?.querySelector('.body');
    if (!content || !contentInner) return;

    // Remove old listener
    if (this._scrollObserver && this._scrollTarget) {
      this._scrollTarget.removeEventListener('scroll', this._scrollObserver);
    }

    const headings = this.sidebarHeadings;
    if (headings.length === 0) return;

    // Both mobile and desktop: .content scrolls
    const isMobile = window.innerWidth <= 960;
    const scrollEl = content;
    this._scrollTarget = scrollEl;

    this._scrollObserver = () => {
      if (this._scrollingToHeading) return;
      const offset = isMobile ? 140 : 60;
      let activeId = headings[0]?.id || '';

      // Check each heading position
      for (const h of headings) {
        const el = contentInner.querySelector(`#${h.id}`) as HTMLElement;
        if (el) {
          const rect = el.getBoundingClientRect();
          const containerRect = scrollEl.getBoundingClientRect();
          if (rect.top - containerRect.top <= offset) {
            activeId = h.id;
          }
        }
      }

      // If scrolled to bottom, activate last heading (for short sections like 結論)
      const isAtBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 100;
      if (isAtBottom && headings.length > 0) {
        activeId = headings[headings.length - 1].id;
      }

      if (activeId !== this.activeTocId) {
        this.activeTocId = activeId;
        // Mobile: auto-scroll active pill into view (both H2 and H3 rows)
        if (isMobile) {
          requestAnimationFrame(() => {
            // Scroll H2 pills row
            const activeH2Pill = this.shadowRoot?.querySelector('.pills-row .pill.active') as HTMLElement;
            if (activeH2Pill) {
              const row = activeH2Pill.closest('.pills-row') as HTMLElement;
              if (row) {
                const pillCenter = activeH2Pill.offsetLeft + activeH2Pill.offsetWidth / 2;
                const rowCenter = row.clientWidth / 2;
                row.scrollTo({ left: pillCenter - rowCenter, behavior: 'smooth' });
              }
            }
            // Scroll H3 pills row
            const activeH3Pill = this.shadowRoot?.querySelector('.pills-h3-row .pill-h3.active') as HTMLElement;
            if (activeH3Pill) {
              const row = activeH3Pill.closest('.pills-h3-row') as HTMLElement;
              if (row) {
                const pillCenter = activeH3Pill.offsetLeft + activeH3Pill.offsetWidth / 2;
                const rowCenter = row.clientWidth / 2;
                row.scrollTo({ left: pillCenter - rowCenter, behavior: 'smooth' });
              }
            }
          });
        }
      }
    };
    scrollEl.addEventListener('scroll', this._scrollObserver, { passive: true });
  }


  private toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  /* ────────────────────────────────────────────
   *  Styles
   * ──────────────────────────────────────────── */
  static styles = css`
    :host {
      display: block;
      font-family: 'Noto Sans TC', sans-serif;
      height: 100vh;
      overflow: hidden;
      --navy: #2B3D6B;
      --beige-bg: #F7F5F0;
      --border-light: #EEEAE4;
      --text-dark: #3D3832;
      --text-body: #6B6356;
      --text-muted: #B0A89C;
      --text-sub: #8A8279;
      --gold-dim: #DDD5C4;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Desktop: Header ── */
    .header { flex-shrink: 0; background: #fff; }

    .topbar {
      display: flex; align-items: center;
      justify-content: space-between;
      height: 56px; padding: 0 32px;
    }
    .topbar-left { display: flex; align-items: center; gap: 16px; }

    .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon img { width: 100%; height: 100%; object-fit: contain; }
    .logo-text { font-size: 18px; font-weight: 600; color: var(--navy); }

    .topbar-divider { width: 1px; height: 20px; background: #ddd; }
    .topbar-org { font-size: 16px; color: var(--text-sub); }
    .topbar-right { display: flex; align-items: center; gap: 16px; }
    .topbar-link { font-size: 16px; color: var(--text-sub); text-decoration: none; transition: color 0.2s; }
    .topbar-link:hover { color: var(--navy); }

    /* Search button – mobile only */
    .search-btn { display: none; background: none; border: none; cursor: pointer; padding: 0; line-height: 0; }

    /* ── Desktop: Menu Bar ── */
    .menubar {
      display: flex; align-items: center;
      height: 48px; padding: 0 32px;
      border-top: 1px solid var(--border-light);
    }
    .menu-tab {
      display: flex; align-items: center;
      height: 100%; padding: 0 16px;
      border: none; background: transparent;
      color: var(--text-sub);
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 17px; font-weight: 500;
      cursor: pointer; white-space: nowrap;
      transition: color 0.2s;
      border-bottom: 2px solid transparent;
    }
    .menu-tab:hover { color: var(--navy); }
    .menu-tab.active { color: var(--navy); border-bottom-color: var(--navy); }

    .menu-toggle {
      display: none; background: none; border: none;
      color: var(--navy); cursor: pointer; padding: 4px; margin-right: 8px;
    }

    /* ── Desktop: Body (navy bg) ── */
    .body {
      display: flex; flex: 1; overflow: hidden;
      background: var(--navy);
      padding: 20px 24px 24px; gap: 20px;
    }

    /* ── Desktop: Sidebar ── */
    .sidebar-card {
      width: 280px; flex-shrink: 0;
      background: #fff; border-radius: 16px;
      padding: 20px; overflow-y: auto;
    }
    .sidebar-heading {
      font-size: 15px; font-weight: 700;
      color: var(--navy); margin-bottom: 12px;
      padding-bottom: 10px; border-bottom: 1px solid var(--border-light);
      line-height: 22px;
    }
    .sidebar-link {
      display: flex; align-items: center;
      width: 100%; padding: 8px 10px; margin-top: 8px;
      border: none; background: transparent; border-radius: 8px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px; font-weight: 400;
      color: var(--text-body); cursor: pointer;
      text-align: left; line-height: 22px;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar-link:hover { background: var(--beige-bg); }
    .sidebar-link.active { background: var(--navy); color: #fff; font-weight: 500; }
    .sidebar-link.sub {
      padding: 6px 12px; font-size: 12px; color: var(--text-sub);
      border: 1px solid var(--text-sub); margin-left: 10px; margin-top: 4px;
      border-radius: 8px; line-height: 1.5; font-weight: 700;
      width: calc(100% - 10px);
    }
    .sidebar-link.sub:hover { color: var(--navy); border-color: var(--navy); background: rgba(159,184,255,0.15); }
    .sidebar-link.sub.active { color: var(--navy); border-color: var(--navy); background: rgba(159,184,255,0.3); font-weight: 700; }

    /* ── Mobile: Section Pills (hidden on desktop) ── */
    .section-pills { display: none; }

    /* ── Desktop: Content Card ── */
    .content-card {
      flex: 1; display: flex;
      background: #fff; border-radius: 16px;
      overflow: hidden; min-width: 0;
    }
    .content {
      flex: 1; overflow-y: auto;
      padding: 32px 32px 32px 36px; min-width: 0;
    }
    .content img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px auto;
      display: block;
    }

    /* ── Desktop: Right TOC ── */
    .right-toc {
      width: 160px; flex-shrink: 0;
      padding: 32px 16px 32px 0;
      border-left: 1px solid #F0EDE8; overflow-y: auto;
    }
    .toc-label {
      font-size: 12px; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.08em; margin-bottom: 10px; padding-left: 14px;
    }
    .toc-link {
      display: block; width: 100%;
      padding: 4px 0 4px 14px;
      border: none; background: none;
      border-left: 2px solid transparent; margin-left: -1px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px; font-weight: 400;
      color: var(--text-sub); cursor: pointer;
      text-align: left; line-height: 20px;
      transition: color 0.15s, border-color 0.15s;
    }
    .toc-link:hover { color: var(--navy); }
    .toc-link.active { color: var(--navy); font-weight: 500; border-left-color: var(--navy); }

    /* ── Overview Components (shared) ── */
    .topic-cards { display: flex; flex-direction: column; gap: 6px; }
    .topic-card {
      display: flex; flex-direction: column;
      gap: 4px; padding: 16px; border-radius: 12px;
      background: var(--navy); cursor: pointer;
      transition: opacity 0.15s;
      border: none; text-align: left; width: 100%;
      font-family: 'Noto Sans TC', sans-serif;
    }
    .topic-card:hover { opacity: 0.9; }
    .topic-card-title { font-size: 13px; font-weight: 500; line-height: 16px; color: var(--gold-dim); }
    .topic-card-sub { font-size: 12px; line-height: 18px; color: rgba(255,255,255,0.5); }

    .meta-info {
      display: flex; flex-direction: column;
      gap: 12px; padding: 16px; border-radius: 12px;
      border: 1px solid var(--border-light);
    }
    .meta-row { display: flex; flex-direction: column; gap: 4px; }
    .meta-label { font-size: 10px; font-weight: 500; line-height: 12px; color: var(--text-muted); }
    .meta-value { font-size: 13px; font-weight: 500; line-height: 16px; color: var(--navy); }
    .meta-value-en { font-size: 13px; font-weight: 500; line-height: 16px; color: var(--navy); font-family: 'Inter', sans-serif; }
    .meta-divider { width: 100%; height: 1px; background: var(--border-light); flex-shrink: 0; }
    .meta-cols { display: flex; gap: 24px; }

    /* Mobile-only extras (topic cards + meta) after content */
    .mobile-extras { display: none; }

    /* ── Desktop: Content Styles ── */
    .md h1 {
      font-family: 'Noto Serif TC', serif;
      font-size: 28px; font-weight: 700; line-height: 38px; color: var(--navy);
      margin: 0 0 20px;
      display: flex; align-items: center; gap: 16px;
    }
    .md h1::after {
      content: ''; flex: 1; height: 1px; background: var(--navy); opacity: 0.3;
    }
    .md h2 {
      font-size: 20px; font-weight: 700; line-height: 30px; color: var(--navy);
      margin: 32px 0 12px; padding-left: 12px; border-left: 4px solid var(--navy);
    }
    .md h3 {
      font-size: 16px; font-weight: 600; color: var(--text-dark); margin: 20px 0 10px;
      padding: 10px 14px; border-left: 3px solid var(--border-light);
      background: var(--beige-bg); border-radius: 0 8px 8px 0;
    }
    .md h4 { font-size: 16px; font-weight: 700; color: var(--text-dark); margin: 20px 0 8px; }
    .md p { font-size: 15px; line-height: 28px; color: var(--text-dark); margin: 0 0 14px; }
    .md ul, .md ol { padding-left: 24px; margin: 0 0 14px; }
    .md li { font-size: 15px; line-height: 28px; color: var(--text-dark); margin-bottom: 4px; }
    .md strong { font-weight: 700; }
    .md hr { border: none; border-top: 1px solid var(--border-light); margin: 24px 0; }
    .md blockquote {
      border-left: 3px solid var(--navy); padding: 10px 14px; margin: 14px 0;
      background: var(--beige-bg); border-radius: 0 8px 8px 0;
    }
    .md blockquote p { color: var(--text-body); margin-bottom: 4px; font-size: 14px; line-height: 26px; }
    .md table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .md th, .md td { border: 1px solid var(--border-light); padding: 10px 14px; text-align: left; line-height: 1.6; }
    .md th, .md thead td { background: var(--navy); font-weight: 600; color: white; font-size: 13px; }
    .md th p, .md th span, .md thead td p, .md thead td span { color: white; margin: 0; }
    .md td { color: var(--text-dark); font-size: 14px; }
    .md tr:nth-child(even) td { background: var(--beige-bg); }
    .md a { color: var(--navy); text-decoration: none; }
    .md a:hover { text-decoration: underline; }

    .sidebar-overlay {
      display: none; position: fixed; inset: 0; top: 104px;
      background: rgba(0,0,0,0.3); z-index: 5;
    }

    /* ════════════════════════════════════════════
     *  MOBILE — matches Paper "Docs V7 — Mobile"
     * ════════════════════════════════════════════ */
    @media (max-width: 960px) {

      /* ── Mobile Header: 52px, compact logo, search icon ── */
      .topbar { height: 52px; padding: 0 16px; }
      .topbar-org, .topbar-divider, .topbar-link { display: none; }
      .search-btn { display: flex; align-items: center; }

      .logo { gap: 8px; }
      .logo-icon { width: 26px; height: 26px; border-radius: 6px; }
      .logo-text { font-size: 14px; font-weight: 600; }

      /* ── Mobile Menu Tabs: 40px, horizontal scroll, no hamburger ── */
      .menubar {
        height: 40px; padding: 0 16px;
        overflow-x: auto; gap: 0;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .menubar::-webkit-scrollbar { display: none; }

      .menu-toggle { display: none !important; }

      .menu-tab {
        font-size: 13px; font-weight: 400;
        padding: 0 14px; height: 100%;
        flex-shrink: 0;
      }
      .menu-tab:first-of-type { padding-left: 0; padding-right: 14px; }
      .menu-tab.active { font-weight: 500; }

      /* ── Mobile Body: navy bg, no scroll on body ── */
      .body {
        flex-direction: column;
        padding: 16px; gap: 12px;
        overflow: hidden;
      }

      /* ── Hide desktop sidebar & overlay ── */
      .sidebar-card { display: none !important; }
      .sidebar-overlay { display: none !important; }
      .right-toc { display: none; }

      /* ── Mobile Section Pills ── */
      .section-pills {
        display: flex; flex-direction: column;
        flex-shrink: 0; width: 100%;
        border-radius: 15px;
        padding: 8px 12px;
        background: #fff;
        scrollbar-width: none;
        gap: 8px;
      }
      .section-pills::-webkit-scrollbar { display: none; }

      .pills-row {
        display: flex; align-items: center;
        overflow-x: auto; gap: 24px;
        scrollbar-width: none;
      }
      .pills-row::-webkit-scrollbar { display: none; }

      .pills-h3-row {
        display: flex; align-items: center;
        overflow-x: auto; gap: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border-light);
        scrollbar-width: none;
      }
      .pills-h3-row::-webkit-scrollbar { display: none; }

      .pill {
        display: flex; align-items: center;
        flex-shrink: 0;
        padding: 4px 0;
        border: none; background: transparent;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 12px; font-weight: 700;
        color: var(--text-sub);
        cursor: pointer; white-space: nowrap;
        transition: background 0.15s, color 0.15s;
        border-radius: 0;
      }
      .pill.active {
        background: var(--navy);
        color: #fff; font-weight: 700;
        padding: 4px 12px;
        border-radius: 8px;
      }

      .pill-h3 {
        display: flex; align-items: center;
        flex-shrink: 0;
        padding: 4px 12px;
        border: 1px solid var(--text-sub);
        border-radius: 8px;
        background: transparent;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 10px; font-weight: 700;
        color: var(--text-sub);
        cursor: pointer; white-space: nowrap;
        transition: all 0.15s;
      }
      .pill-h3.active {
        background: rgba(159,184,255,0.3);
        border-color: var(--navy);
        color: var(--navy);
      }

      /* ── Mobile Content Card ── */
      .content-card {
        flex: 1;
        border-radius: 16px;
        overflow: hidden;
        min-height: 0;
      }
      .content {
        padding: 22px 18px 22px;
        overflow-y: auto;
        height: 100%;
      }

      /* ── Mobile extras: shown only on phone ── */
      .mobile-extras {
        display: flex; flex-direction: column;
        gap: 16px; margin-top: 16px;
      }

      /* ── Mobile Content Styles ── */
      .md h1 { font-size: 22px; line-height: 32px; gap: 12px; }
      .md h2 { font-size: 20px; line-height: 28px; margin: 28px 0 12px; padding-left: 10px; border-left-width: 3px; }
      .md h3 { font-size: 18px; margin: 24px 0 10px; }
      .md p, .md li { font-size: 14px; line-height: 24px; }
      .md p { margin: 0 0 12px; }
      .md ul, .md ol { padding-left: 24px; margin: 0 0 12px; }
      .md table { font-size: 14px; }
      .md th, .md td { padding: 10px 12px; }
      .md blockquote p { font-size: 14px; line-height: 24px; }
    }
  `;

  /* ────────────────────────────────────────────
   *  Templates
   * ──────────────────────────────────────────── */

  private renderMobileExtras() {
    return html`
      <div class="mobile-extras">
        <div class="topic-cards">
          ${this.topicChapters.map(ch => html`
            <button class="topic-card" @click=${() => this.selectChapter(ch.chapter_id)}>
              <span class="topic-card-title">${ch.title}</span>
              <span class="topic-card-sub">${chapterMeta[ch.chapter_id]?.subtitle || ''}</span>
            </button>
          `)}
        </div>
        <div class="meta-info">
          <div class="meta-row">
            <span class="meta-label">參考框架</span>
            <span class="meta-value-en">Social Reporting Standard</span>
          </div>
          <div class="meta-divider"></div>
          <div class="meta-cols">
            <div class="meta-row">
              <span class="meta-label">方法論</span>
              <span class="meta-value">影響力邏輯模型</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">區間</span>
              <span class="meta-value-en">2022 – 2024</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const chapter = this.activeChapter;

    return html`
      <div style="display:flex;flex-direction:column;height:100vh;">
        <!-- Header -->
        <div class="header">
          <div class="topbar">
            <div class="topbar-left">
              <a class="logo" href="/">
                <div class="logo-icon"><img src="/favicon.svg" alt="慈濟"></div>
                <span class="logo-text">影響力報告書</span>
              </a>
              <div class="topbar-divider"></div>
              <span class="topbar-org">慈濟慈善基金會</span>
            </div>
            <div class="topbar-right">
              <a class="topbar-link" href="/">返回官網</a>
              <button class="search-btn" aria-label="搜尋">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="7.5" cy="7.5" r="6" stroke="#2B3D6B" stroke-width="1.8"/>
                  <line x1="12" y1="12" x2="16.5" y2="16.5" stroke="#2B3D6B" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="menubar">
            <button class="menu-toggle" @click=${this.toggleSidebar} aria-label="選單">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            ${this.chapters.map(ch => html`
              <button
                class="menu-tab ${ch.chapter_id === this.activeChapterId ? 'active' : ''}"
                @click=${() => this.selectChapter(ch.chapter_id)}
              >${ch.title}</button>
            `)}
          </div>
        </div>

        <!-- Body -->
        <div class="body">
          <div class="sidebar-overlay ${this.sidebarOpen ? 'open' : ''}" @click=${() => { this.sidebarOpen = false; }}></div>

          <!-- Desktop: Sidebar (H1 + H2 headings from content) -->
          <div class="sidebar-card ${this.sidebarOpen ? 'open' : ''}">
            <div class="sidebar-heading">${this.sidebarHeadings.find(h => h.level === 1)?.text || chapter?.title || ''}</div>
            ${(() => {
              const allHeadings = this.sidebarHeadings;
              const h2Items = allHeadings.filter(h => h.level === 2);
              return h2Items.map(h2 => {
                // Find H3 children between this H2 and the next H2
                const h2Idx = allHeadings.findIndex(x => x.id === h2.id);
                const h3Children: { id: string; text: string; level: number }[] = [];
                for (let i = h2Idx + 1; i < allHeadings.length; i++) {
                  if (allHeadings[i].level <= 2) break;
                  if (allHeadings[i].level === 3) h3Children.push(allHeadings[i]);
                }
                const isH2Active = this.activeTocId === h2.id;
                const isChildActive = h3Children.some(c => this.activeTocId === c.id);

                return html`
                  <button
                    class="sidebar-link ${isH2Active || isChildActive ? 'active' : ''}"
                    @click=${() => this.scrollToHeading(h2.id)}
                  >${h2.text}</button>
                  ${h3Children.map(h3 => html`
                    <button
                      class="sidebar-link sub ${this.activeTocId === h3.id ? 'active' : ''}"
                      @click=${() => this.scrollToHeading(h3.id)}
                    >${h3.text}</button>
                  `)}
                `;
              });
            })()}
          </div>

          <!-- Mobile: Section Pills (H1 title + H2 pills, H3 sub-pills) -->
          ${(() => {
            const allH = this.sidebarHeadings;
            const h1 = allH.find(h => h.level === 1);
            const h2s = allH.filter(h => h.level === 2);
            // Find H3 children of active H2
            const activeH2 = h2s.find(h => {
              if (this.activeTocId === h.id) return true;
              const idx = allH.findIndex(x => x.id === h.id);
              for (let i = idx + 1; i < allH.length; i++) {
                if (allH[i].level <= 2) break;
                if (allH[i].id === this.activeTocId) return true;
              }
              return false;
            });
            const activeH3s: { id: string; text: string; level: number }[] = [];
            if (activeH2) {
              const idx = allH.findIndex(x => x.id === activeH2.id);
              for (let i = idx + 1; i < allH.length; i++) {
                if (allH[i].level <= 2) break;
                if (allH[i].level === 3) activeH3s.push(allH[i]);
              }
            }
            return h2s.length > 0 ? html`
              <div class="section-pills">
                <div class="pills-row">
                  ${h2s.map(h => html`
                    <button class="pill ${this.activeTocId === h.id || (activeH2 && activeH2.id === h.id) ? 'active' : ''}"
                      @click=${() => this.scrollToHeading(h.id)}
                    >${h.text}</button>
                  `)}
                </div>
                ${activeH3s.length > 0 ? html`
                  <div class="pills-h3-row">
                    ${activeH3s.map(h3 => html`
                      <button class="pill-h3 ${this.activeTocId === h3.id ? 'active' : ''}"
                        @click=${() => this.scrollToHeading(h3.id)}
                      >${h3.text}</button>
                    `)}
                  </div>
                ` : ''}
              </div>
            ` : '';
          })()}

          <!-- Content Card -->
          <div class="content-card">
            <div class="content">
              <div class="content-inner md">
                ${this.loading
                  ? html`<p style="color:var(--text-muted);padding:40px 0;text-align:center">載入中...</p>`
                  : html`${unsafeHTML(this.renderedContent)}${this.isAboutOverview ? this.renderMobileExtras() : ''}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
