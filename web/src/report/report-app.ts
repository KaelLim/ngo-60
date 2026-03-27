import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';

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

async function fetchMarkdown(chapterId: string, pageId: string): Promise<string> {
  const key = `${chapterId}/${pageId}`;
  if (contentCache.has(key)) return contentCache.get(key)!;
  try {
    const res = await fetch(`/api/report-pages/${chapterId}/${pageId}`);
    if (!res.ok) return '';
    const data = await res.json();
    const content = data.content || '';
    contentCache.set(key, content);
    return content;
  } catch {
    return '';
  }
}

function extractHeadings(md: string): { id: string; text: string }[] {
  const headings: { id: string; text: string }[] = [];
  const regex = /^## (.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    const text = match[1].replace(/[*_`]/g, '').trim();
    const id = 'h-' + text.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]/g, '').toLowerCase();
    headings.push({ id, text });
  }
  return headings;
}

@customElement('report-app')
export class ReportApp extends LitElement {
  @state() private chapters: ApiChapter[] = [];
  @state() private chapterPages: ApiPage[] = [];
  @state() private activeChapterId = '';
  @state() private activePageId = '';
  @state() private sidebarOpen = false;
  @state() private activeTocId = '';
  @state() private currentMarkdown = '';
  @state() private loading = true;

  private get activeChapter(): ApiChapter | undefined {
    return this.chapters.find(c => c.chapter_id === this.activeChapterId);
  }

  private get activePage(): ApiPage | undefined {
    return this.chapterPages.find(p => p.page_id === this.activePageId);
  }

  private get renderedContent(): string {
    const md = this.currentMarkdown;
    if (!md) return '';
    let result = marked.parse(md, { async: false }) as string;
    const headings = extractHeadings(md);
    for (const h of headings) {
      result = result.replace(`<h2>${h.text}</h2>`, `<h2 id="${h.id}">${h.text}</h2>`);
    }
    return result;
  }

  private get tocHeadings() { return extractHeadings(this.currentMarkdown); }

  private get topicChapters() {
    return this.chapters.filter(c => c.chapter_id in chapterMeta);
  }

  private get isAboutOverview(): boolean {
    if (this.activeChapterId !== 'about') return false;
    const firstPage = this.chapterPages[0];
    return !!firstPage && this.activePageId === firstPage.page_id;
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
      await this.loadChapterPages();
      this.loadFromHash();
    }
    this.loading = false;
    window.addEventListener('hashchange', () => this.loadFromHash());
  }

  private async loadChapterPages() {
    try {
      const res = await fetch(`/api/report-pages/${this.activeChapterId}`);
      this.chapterPages = await res.json();
    } catch {
      this.chapterPages = [];
    }
    if (this.chapterPages.length > 0 && !this.chapterPages.find(p => p.page_id === this.activePageId)) {
      this.activePageId = this.chapterPages[0].page_id;
    }
  }

  private async loadFromHash() {
    const hash = location.hash.replace('#', '');
    if (hash) {
      const [chId, pgId] = hash.split('/');
      const ch = this.chapters.find(c => c.chapter_id === chId);
      if (ch) {
        if (this.activeChapterId !== ch.chapter_id) {
          this.activeChapterId = ch.chapter_id;
          await this.loadChapterPages();
        }
        if (pgId) {
          const pg = this.chapterPages.find(p => p.page_id === pgId);
          if (pg) this.activePageId = pg.page_id;
        }
      }
    }
    await this.loadContent();
  }

  private async loadContent() {
    this.loading = true;
    this.currentMarkdown = await fetchMarkdown(this.activeChapterId, this.activePageId);
    this.loading = false;
  }

  private async selectChapter(chId: string) {
    this.activeChapterId = chId;
    await this.loadChapterPages();
    if (this.chapterPages.length > 0) {
      this.activePageId = this.chapterPages[0].page_id;
    }
    location.hash = `${chId}/${this.activePageId}`;
    this.sidebarOpen = false;
    this.scrollContentTop();
    await this.loadContent();
  }

  private async selectPage(pgId: string) {
    this.activePageId = pgId;
    location.hash = `${this.activeChapterId}/${pgId}`;
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
    const content = this.shadowRoot?.querySelector('.content');
    const el = content?.querySelector(`#${id}`);
    if (el && content) {
      const top = (el as HTMLElement).offsetTop - 20;
      content.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { this._scrollingToHeading = false; }, 600);
    }
  }

  private _scrollingToHeading = false;
  private _scrollObserver: any = null;

  updated() {
    this.setupScrollSpy();
  }

  private setupScrollSpy() {
    const content = this.shadowRoot?.querySelector('.content');
    if (!content) return;
    if (this._scrollObserver) {
      content.removeEventListener('scroll', this._scrollObserver);
    }
    const headings = this.tocHeadings;
    if (headings.length === 0) return;
    this._scrollObserver = () => {
      if (this._scrollingToHeading) return;
      const scrollTop = content.scrollTop;
      let activeId = headings[0]?.id || '';
      for (const h of headings) {
        const el = content.querySelector(`#${h.id}`) as HTMLElement;
        if (el && el.offsetTop - 60 <= scrollTop) {
          activeId = h.id;
        }
      }
      if (activeId !== this.activeTocId) {
        this.activeTocId = activeId;
      }
    };
    content.addEventListener('scroll', this._scrollObserver, { passive: true });
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
      font-size: 16px; font-weight: 600;
      color: var(--navy); text-transform: uppercase;
      letter-spacing: 0.1em; margin-bottom: 8px;
    }
    .sidebar-link {
      display: flex; align-items: center;
      width: 100%; padding: 10px 12px;
      border: none; background: transparent; border-radius: 10px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px; font-weight: 400;
      color: var(--text-body); cursor: pointer;
      text-align: left; line-height: 24px;
      transition: background 0.15s, color 0.15s;
    }
    .sidebar-link:hover { background: var(--beige-bg); }
    .sidebar-link.active { background: var(--navy); color: #fff; font-weight: 500; }

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

    /* ── Desktop: Right TOC ── */
    .right-toc {
      width: 180px; flex-shrink: 0;
      padding: 40px 20px 40px 0;
      border-left: 1px solid #F0EDE8; overflow-y: auto;
    }
    .toc-label {
      font-size: 15px; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase;
      letter-spacing: 0.08em; margin-bottom: 14px; padding-left: 16px;
    }
    .toc-link {
      display: block; width: 100%;
      padding: 5px 0 5px 16px;
      border: none; background: none;
      border-left: 2px solid transparent; margin-left: -1px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 17px; font-weight: 400;
      color: var(--text-sub); cursor: pointer;
      text-align: left; line-height: 24px;
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

    /* Mobile-only extras (topic cards + meta) after markdown */
    .mobile-extras { display: none; }

    /* ── Desktop: Markdown ── */
    .md h1 {
      font-family: 'Noto Serif TC', serif;
      font-size: 28px; font-weight: 700; line-height: 38px; color: var(--navy);
      margin: 0 0 12px; padding-bottom: 14px; border-bottom: 2px solid var(--navy);
    }
    .md h2 {
      font-size: 20px; font-weight: 700; line-height: 30px; color: var(--navy);
      margin: 32px 0 12px; padding-left: 12px; border-left: 3px solid var(--navy);
    }
    .md h3 { font-size: 17px; font-weight: 700; color: var(--text-dark); margin: 24px 0 10px; }
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
    .md th { background: var(--navy); font-weight: 600; color: white; font-size: 13px; }
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

      /* ── Mobile Body: navy bg, vertical scroll ── */
      .body {
        flex-direction: column;
        padding: 16px; gap: 12px;
        overflow-y: auto;
        overflow-x: hidden;
      }

      /* ── Hide desktop sidebar & overlay ── */
      .sidebar-card { display: none !important; }
      .sidebar-overlay { display: none !important; }
      .right-toc { display: none; }

      /* ── Mobile Section Pills ── */
      .section-pills {
        display: flex; align-items: center;
        flex-shrink: 0; width: 100%;
        overflow-x: auto; gap: 8px;
        border-radius: 14px;
        padding: 10px 12px;
        background: #fff;
        border: 1px solid rgba(255,255,255,0.25);
        scrollbar-width: none;
      }
      .section-pills::-webkit-scrollbar { display: none; }

      .pill {
        display: flex; align-items: center;
        flex-shrink: 0;
        padding: 8px 14px;
        border-radius: 20px;
        border: none; background: transparent;
        font-family: 'Noto Sans TC', sans-serif;
        font-size: 13px; font-weight: 400;
        color: var(--text-sub);
        cursor: pointer; white-space: nowrap;
        transition: background 0.15s, color 0.15s;
      }
      .pill.active {
        background: var(--navy);
        color: #fff; font-weight: 500;
        padding: 6px 12px;
        border-radius: 8px;
      }

      /* ── Mobile Content Card ── */
      .content-card {
        flex: 0 0 auto;
        border-radius: 16px;
        overflow: visible;
      }
      .content {
        padding: 22px 18px 22px;
        overflow: visible;
      }

      /* ── Mobile extras: shown only on phone ── */
      .mobile-extras {
        display: flex; flex-direction: column;
        gap: 16px; margin-top: 16px;
      }

      /* ── Mobile Markdown ── */
      .md h1 { font-size: 24px; line-height: 34px; padding-bottom: 12px; border-bottom-width: 1px; }
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
    const headings = this.tocHeadings;

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

          <!-- Desktop: Sidebar -->
          <div class="sidebar-card ${this.sidebarOpen ? 'open' : ''}">
            <div class="sidebar-heading">${chapter?.title || ''}</div>
            ${this.chapterPages.map(pg => html`
              <button
                class="sidebar-link ${pg.page_id === this.activePageId ? 'active' : ''}"
                @click=${() => this.selectPage(pg.page_id)}
              >${pg.title}</button>
            `)}
          </div>

          <!-- Mobile: Section Pills -->
          ${this.chapterPages.length > 1 ? html`
            <div class="section-pills">
              ${this.chapterPages.map(pg => html`
                <button
                  class="pill ${pg.page_id === this.activePageId ? 'active' : ''}"
                  @click=${() => this.selectPage(pg.page_id)}
                >${pg.title}</button>
              `)}
            </div>
          ` : ''}

          <!-- Content Card -->
          <div class="content-card">
            <div class="content">
              <div class="content-inner md">
                ${this.loading
                  ? html`<p style="color:var(--text-muted);padding:40px 0;text-align:center">載入中...</p>`
                  : html`${unsafeHTML(this.renderedContent)}${this.isAboutOverview ? this.renderMobileExtras() : ''}`}
              </div>
            </div>
            ${headings.length > 0 ? html`
              <div class="right-toc">
                <div class="toc-label">本頁內容</div>
                ${headings.map(h => html`
                  <button
                    class="toc-link ${this.activeTocId === h.id ? 'active' : ''}"
                    @click=${() => this.scrollToHeading(h.id)}
                  >${h.text}</button>
                `)}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }
}
