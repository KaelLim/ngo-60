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
      animation: slideInPage 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    :host([closing]) {
      animation: slideOutPage 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
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

    /* Modal card */
    :host([desktopMode]) .modal-container {
      display: flex;
    }

    .modal-container {
      display: none;
    }

    .modal-card {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 480px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      animation: modalSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    :host([desktopMode][closing]) .modal-card {
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

    /* Modal header */
    .modal-header {
      display: flex;
      justify-content: flex-end;
      padding: 16px 16px 0 16px;
    }

    .close-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f4f1ee;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-button:hover {
      background: #e8e5e2;
      transform: scale(1.05);
    }

    .close-button:active {
      transform: scale(0.95);
    }

    .close-button svg {
      width: 20px;
      height: 20px;
      color: #666;
    }

    /* Modal body */
    .modal-body {
      padding: 8px 32px 32px 32px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
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

    .modal-photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      background: #f4f1ee;
      margin-bottom: 16px;
    }

    .modal-author {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 22px;
      font-weight: 500;
      color: #121212;
      margin: 0 0 20px 0;
    }

    .modal-divider {
      width: 60px;
      height: 2px;
      background: #e4ddd4;
      margin-bottom: 24px;
    }

    .modal-content {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #444;
      line-height: 1.8;
      text-align: left;
      width: 100%;
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
        <div class="modal-card">
          <div class="modal-header">
            <button class="close-button" @click=${this.handleBack}>
              ${closeIcon}
            </button>
          </div>
          <div class="modal-body">
            ${imageUrl ? html`
              <img class="modal-photo" src="${imageUrl}" alt="${author}" />
            ` : html`
              <div class="modal-photo"></div>
            `}
            <h2 class="modal-author">${author}</h2>
            <div class="modal-divider"></div>
            <div class="modal-content">
              ${this.loading ? html`<p>載入中...</p>` : contentParagraphs}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blessing-page': BlessingPage;
  }
}
