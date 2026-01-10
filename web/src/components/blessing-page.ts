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

  private storeController!: StoreController<AppStore>;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #0e2669;
    }

    .page-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Header with background image */
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
      transition: transform 0.2s;
    }

    .back-button:active {
      transform: scale(0.95);
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

    /* Body content */
    .body {
      flex: 1;
      background: white;
      border-radius: 40px 40px 0 0;
      padding: 40px 12px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .body::-webkit-scrollbar {
      display: none;
    }

    .body-content {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #121212;
      line-height: 1.4;
    }

    .body-content p {
      margin: 0 0 1em 0;
    }

    .body-content p:last-child {
      margin-bottom: 0;
    }

    /* Footer */
    .footer {
      background: #121212;
      padding: 8px 12px;
      text-align: center;
      flex-shrink: 0;
    }

    .footer p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: white;
      line-height: 1.4;
      margin: 0;
    }

    /* Animation */
    :host {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    /* Desktop mode - embedded instead of fixed overlay */
    :host([desktopMode]) {
      position: relative;
      inset: auto;
      z-index: auto;
      height: 100%;
    }

    :host([desktopMode]) {
      animation: none;
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
    this.appStore.closeBlessing();
  }

  render() {
    // Back arrow SVG
    const backArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    `;

    // Loading state
    if (this.loading) {
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

    // No data - show default message
    const blessing = this.blessingData;
    const author = blessing?.author || '證嚴上人';
    const content = blessing?.full_content || blessing?.message || '';
    const imageUrl = blessing?.image_url || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800';

    return html`
      <div class="page-container">
        <!-- Header -->
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

        <!-- Body -->
        <div class="body">
          <div class="body-content">
            ${content ? content.split('\n').map(paragraph =>
              paragraph.trim() ? html`<p>${paragraph}</p>` : ''
            ) : html`<p>暫無內容</p>`}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Copyright © 2020 Open Source Matters. 版權所有. Copyright, OOO Foundation.</p>
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
