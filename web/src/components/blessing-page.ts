import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, Blessing } from '../services/api.js';

@customElement('blessing-page')
export class BlessingPage extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @property({ type: Number })
  blessingId: number | null = null;

  @property({ type: Boolean, reflect: true })
  desktopMode = false;

  @state()
  private blessingData: Blessing | null = null;

  @state()
  private loading = false;

  @state()
  private allBlessings: Blessing[] = [];

  @state()
  private slideDirection: 'prev' | 'next' | 'slide-in-prev' | 'slide-in-next' | null = null;

  @state()
  private hasNavigated = false;

  @property({ type: Boolean, reflect: true })
  closing = false;

  private storeController!: StoreController<AppStore>;

  static styles = css`
    /* ===== Mobile: Full Page Layout ===== */
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #0e2669;
    }

    /* Mobile: 限制寬度並置中 */
    @media (max-width: 767px) {
      :host {
        max-width: 430px;
        margin: 0 auto;
      }

      .page-container {
        animation: slideInPage 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      :host([closing]) .page-container {
        animation: slideOutPage 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
    }

    @keyframes slideInPage {
      from { transform: translateX(100%); opacity: 0.5; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutPage {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }

    /* Mobile page container */
    .page-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .header {
      position: relative;
      height: 252px;
      flex-shrink: 0;
    }

    .header-bg {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .header-bg img {
      width: 100%;
      height: 288px;
      object-fit: cover;
      object-position: center;
    }

    .header-overlay {
      position: absolute;
      inset: 0;
      background: rgba(14, 38, 105, 0.9);
    }

    .header-content {
      position: absolute;
      top: 70px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s backwards;
    }

    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .back-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s backwards;
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .back-button:active {
      transform: scale(0.92);
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .page-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 500;
      color: white;
      line-height: 1.2;
      margin: 0;
    }

    .body {
      flex: 1;
      background: white;
      border-radius: 40px 40px 0 0;
      padding: 40px 12px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
    }

    .body::-webkit-scrollbar {
      display: none;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .body-content {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #121212;
      line-height: 1.6;
    }

    .body-content p {
      margin: 0 0 1em 0;
    }

    .body-content p:last-child {
      margin-bottom: 0;
    }

    /* ===== Desktop: Modal Layout ===== */
    :host([desktopMode]) {
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeInBackdrop 0.3s ease-out forwards;
    }

    :host([desktopMode][closing]) {
      animation: fadeOutBackdrop 0.25s ease-in forwards;
    }

    @keyframes fadeInBackdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes fadeOutBackdrop {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    /* Modal wrapper with nav arrows */
    :host([desktopMode]) .modal-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-container {
      display: none;
    }

    /* Nav arrows */
    .nav-arrow {
      width: 48px;
      height: 48px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .nav-arrow:hover {
      opacity: 1;
    }

    .nav-arrow:disabled {
      opacity: 0.2;
      cursor: not-allowed;
    }

    .nav-arrow svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .nav-arrow.prev svg {
      transform: rotate(180deg);
    }

    /* Modal main card */
    .modal-main {
      width: 720px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      animation: modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    /* Disable entrance animation after navigation */
    .modal-main.no-entrance {
      animation: none;
    }

    :host([desktopMode][closing]) .modal-main {
      animation: modalSlideOut 0.25s ease-in forwards;
    }

    @keyframes modalSlideIn {
      from { opacity: 0; transform: scale(0.9) translateY(20px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @keyframes modalSlideOut {
      from { opacity: 1; transform: scale(1) translateY(0); }
      to { opacity: 0; transform: scale(0.9) translateY(20px); }
    }

    /* Modal header with background */
    .modal-header {
      position: relative;
      height: 323px;
      border-radius: 40px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .modal-header-bg {
      position: absolute;
      inset: 0;
    }

    .modal-header-bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .modal-header-overlay {
      position: absolute;
      inset: 0;
      background: rgba(14, 38, 105, 0.9);
    }

    .modal-close-row {
      position: absolute;
      top: 24px;
      right: 24px;
    }

    .close-button {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.2s ease;
    }

    .close-button:hover {
      opacity: 0.8;
      transform: scale(1.1);
    }

    .close-button svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    /* Slide animations for modal switching - pure left/right only */
    .modal-main.slide-out-left {
      animation: slideOutLeft 0.2s ease-in forwards !important;
    }

    .modal-main.slide-out-right {
      animation: slideOutRight 0.2s ease-in forwards !important;
    }

    .modal-main.slide-in-left {
      animation: slideInLeft 0.25s ease-out forwards !important;
    }

    .modal-main.slide-in-right {
      animation: slideInRight 0.25s ease-out forwards !important;
    }

    @keyframes slideOutLeft {
      from { transform: translateX(0); }
      to { transform: translateX(-80px); opacity: 0; }
    }

    @keyframes slideOutRight {
      from { transform: translateX(0); }
      to { transform: translateX(80px); opacity: 0; }
    }

    @keyframes slideInLeft {
      from { transform: translateX(80px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideInRight {
      from { transform: translateX(-80px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    /* Content wrapper (title + body) - overlaps header */
    .modal-content-wrapper {
      margin-top: -165px;
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .modal-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 32px;
      font-weight: 500;
      color: white;
      line-height: 1.4;
      margin: 0;
      padding: 0 40px 24px 40px;
      flex-shrink: 0;
    }

    /* Modal body */
    .modal-body {
      background: white;
      border-radius: 40px;
      padding: 40px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
    }

    .modal-body::-webkit-scrollbar {
      width: 6px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 3px;
    }

    .modal-content {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #121212;
      line-height: 1.4;
    }

    .modal-content p {
      margin: 0 0 1em 0;
    }

    .modal-content p:last-child {
      margin-bottom: 0;
    }

    /* Hide mobile layout on desktop */
    :host([desktopMode]) .page-container {
      display: none;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.loadBlessingData();
    this.loadAllBlessings();
  }

  private async loadAllBlessings() {
    try {
      this.allBlessings = await api.getBlessings();
    } catch (error) {
      console.error('Failed to load blessings list:', error);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('blessingId')) {
      this.loadBlessingData();
    }
  }

  private async loadBlessingData() {
    // Use blessingId from property or from store
    const id = this.blessingId || this.appStore.currentBlessingId;
    if (!id) {
      this.blessingData = null;
      return;
    }

    this.loading = true;
    try {
      const data = await api.getBlessingById(id);
      this.blessingData = data;
    } catch (error) {
      console.error('Failed to load blessing:', error);
      this.blessingData = null;
    } finally {
      this.loading = false;
    }
  }

  private handleBack() {
    this.closing = true;
    const duration = this.desktopMode ? 250 : 350;
    setTimeout(() => {
      this.appStore.closeBlessing();
    }, duration);
  }

  private handleBackdropClick(e: MouseEvent) {
    // Only close if clicking the backdrop itself, not the modal card
    if (e.target === e.currentTarget) {
      this.handleBack();
    }
  }

  private getCurrentIndex(): number {
    const currentId = this.blessingId || this.appStore.currentBlessingId;
    return this.allBlessings.findIndex(b => b.id === currentId);
  }

  private navigateBlessing(direction: 'prev' | 'next') {
    const currentIndex = this.getCurrentIndex();
    if (currentIndex === -1 || this.slideDirection) return;

    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= this.allBlessings.length) return;

    // Mark as navigated to disable entrance animation
    this.hasNavigated = true;

    // Start slide-out animation
    this.slideDirection = direction;

    // After slide-out, load new content and slide-in
    setTimeout(() => {
      const newBlessing = this.allBlessings[newIndex];
      this.appStore.openBlessing(newBlessing.id);

      // Change to slide-in state
      this.slideDirection = direction === 'prev' ? 'slide-in-prev' : 'slide-in-next';

      // Clear animation state
      setTimeout(() => {
        this.slideDirection = null;
      }, 300);
    }, 200);
  }

  private getSlideClass(): string {
    if (!this.slideDirection) return '';
    if (this.slideDirection === 'prev') return 'slide-out-left';
    if (this.slideDirection === 'next') return 'slide-out-right';
    if (this.slideDirection === 'slide-in-prev') return 'slide-in-right';
    if (this.slideDirection === 'slide-in-next') return 'slide-in-left';
    return '';
  }

  render() {
    const blessing = this.blessingData;
    const author = blessing?.author || '證嚴上人';
    const content = blessing?.full_content || blessing?.message || '';
    const imageUrl = blessing?.image_url || '';

    // Back arrow SVG (for mobile)
    const backArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    `;

    // Close icon SVG (for desktop modal)
    const closeIcon = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    `;

    // Navigation arrow SVG
    const navArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    `;

    // Content paragraphs
    const contentParagraphs = content
      ? content.split('\n').map(paragraph =>
          paragraph.trim() ? html`<p>${paragraph}</p>` : ''
        )
      : html`<p>暫無內容</p>`;

    // Loading state for mobile
    if (this.loading && !this.desktopMode) {
      return html`
        <div class="page-container">
          <div class="header">
            <div class="header-overlay"></div>
            <div class="header-content">
              <button class="back-button" @click=${this.handleBack}>
                ${backArrow}
              </button>
            </div>
          </div>
          <div class="body" style="display: flex; align-items: center; justify-content: center;">
            <p>載入中...</p>
          </div>
        </div>
      `;
    }

    return html`
      <!-- Mobile: Full Page Layout -->
      <div class="page-container">
        <div class="header">
          <div class="header-bg">
            <img src="${imageUrl}" alt="" />
          </div>
          <div class="header-overlay"></div>
          <div class="header-content">
            <button class="back-button" @click=${this.handleBack}>
              ${backArrow}
            </button>
            <h1 class="page-title">${author}</h1>
          </div>
        </div>
        <div class="body">
          <div class="body-content">
            ${contentParagraphs}
          </div>
        </div>
      </div>

      <!-- Desktop: Modal Layout -->
      <div class="modal-container" @click=${this.handleBackdropClick}>
        <button
          class="nav-arrow prev"
          @click=${() => this.navigateBlessing('prev')}
          ?disabled=${this.getCurrentIndex() <= 0}
        >
          ${navArrow}
        </button>

        <div class="modal-main ${this.getSlideClass()} ${this.hasNavigated && !this.slideDirection ? 'no-entrance' : ''}">
          <div class="modal-header">
            <div class="modal-header-bg">
              ${imageUrl ? html`<img src="${imageUrl}" alt="" />` : ''}
            </div>
            <div class="modal-header-overlay"></div>
            <div class="modal-close-row">
              <button class="close-button" @click=${this.handleBack}>
                ${closeIcon}
              </button>
            </div>
          </div>
          <div class="modal-content-wrapper">
            <h2 class="modal-title">${author}</h2>
            <div class="modal-body">
              <div class="modal-content">
                ${this.loading ? html`<p>載入中...</p>` : contentParagraphs}
              </div>
            </div>
          </div>
        </div>

        <button
          class="nav-arrow next"
          @click=${() => this.navigateBlessing('next')}
          ?disabled=${this.getCurrentIndex() >= this.allBlessings.length - 1}
        >
          ${navArrow}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blessing-page': BlessingPage;
  }
}
