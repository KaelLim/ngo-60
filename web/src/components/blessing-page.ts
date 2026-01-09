import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';

@customElement('blessing-page')
export class BlessingPage extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  private storeController!: StoreController;

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
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
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

    return html`
      <div class="page-container">
        <!-- Header -->
        <div class="header">
          <div class="header-bg">
            <img src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800" alt="" />
          </div>
          <div class="header-overlay"></div>
          <div class="header-content">
            <button class="back-button" @click=${this.handleBack}>
              ${backArrow}
            </button>
            <h1 class="page-title">證嚴上人</h1>
          </div>
        </div>

        <!-- Body -->
        <div class="body">
          <div class="body-content">
            <p>任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。</p>
            <p>捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以</p>
            <p>電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。</p>
            <p>捶大不喀裹女連不以電，。的身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的</p>
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
