import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { GestureController } from '../controllers/gesture-controller.js';

import './app-poster.js';
import './app-sheet.js';
import './blessing-page.js';
import './topic-page.js';
import './sheet-content.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  private storeController!: StoreController<AppStore>;
  private gestureController!: GestureController;

  @query('.main-container')
  private mainContainer!: HTMLElement;

  @query('.homepage-content')
  private homepageContent!: HTMLElement;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: #0e2669;
    }

    /* Mobile layout */
    .main-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: transform;
    }

    .main-container.dragging {
      transition: none;
    }

    .desktop-layout {
      display: none;
    }

    /* Hide mobile-only elements on tablet/desktop */
    @media (min-width: 768px) {
      .mobile-only {
        display: none !important;
      }
    }

    /* Desktop layout (1024px+) */
    @media (min-width: 1024px) {
      .main-container {
        display: none;
      }

      .desktop-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        height: 100%;
        width: 100%;
      }

      .desktop-left {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .desktop-left-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .desktop-right {
        background: #f5f5f5;
        border-left: 1px solid rgba(0,0,0,0.1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      /* Inner pages in desktop mode */
      .desktop-inner-page {
        position: absolute;
        inset: 0;
        z-index: 10;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    }

    /* Tablet layout (768px - 1023px) */
    @media (min-width: 768px) and (max-width: 1023px) {
      .desktop-layout {
        display: grid;
        grid-template-columns: 1fr 360px;
        height: 100%;
        width: 100%;
      }

      .main-container {
        display: none;
      }

      .desktop-left {
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .desktop-left-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .desktop-right {
        background: #f5f5f5;
        border-left: 1px solid rgba(0,0,0,0.1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .desktop-inner-page {
        position: absolute;
        inset: 0;
        z-index: 10;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.gestureController = new GestureController(
      this,
      this.appStore,
      () => this.mainContainer,
      () => this.homepageContent
    );

    // Initialize position
    this.appStore.setSheetState('peek');

    // Set viewport height
    this.setVH();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('popstate', this.handlePopState);
  }

  private setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  private handleResize = () => {
    this.setVH();
    this.appStore.setSheetState(this.appStore.sheetState);
  };

  private handlePopState = () => {
    this.appStore.handleRoute();
  };

  render() {
    const containerStyle = `transform: translateY(${this.appStore.containerY}px)`;
    const isDragging = this.appStore.isDragging;
    const currentPage = this.appStore.currentPage;

    return html`
      <!-- Mobile Layout -->
      <div
        class="main-container ${isDragging ? 'dragging' : ''}"
        style=${containerStyle}
        @touchstart=${this.gestureController.onTouchStart}
        @touchmove=${this.gestureController.onTouchMove}
        @touchend=${this.gestureController.onTouchEnd}
        @mousedown=${this.gestureController.onMouseDown}
      >
        <app-poster></app-poster>
        <app-sheet></app-sheet>
      </div>

      <!-- Mobile: Fullscreen pages -->
      ${currentPage === 'blessing' ? html`<blessing-page class="mobile-only" .blessingId=${this.appStore.currentBlessingId}></blessing-page>` : ''}
      ${currentPage === 'category' && this.appStore.activeTab === 'topics'
        ? html`<topic-page class="mobile-only" .topicId=${this.appStore.currentCategoryId || 1}></topic-page>`
        : ''}

      <!-- Desktop/Tablet Layout -->
      <div class="desktop-layout">
        <div class="desktop-left">
          <div class="desktop-left-content">
            <app-poster .desktopMode=${true}></app-poster>
          </div>

          <!-- Desktop: Inner pages overlay on left area -->
          ${currentPage === 'blessing' ? html`
            <div class="desktop-inner-page">
              <blessing-page .desktopMode=${true} .blessingId=${this.appStore.currentBlessingId}></blessing-page>
            </div>
          ` : ''}
          ${currentPage === 'category' && this.appStore.activeTab === 'topics' ? html`
            <div class="desktop-inner-page">
              <topic-page .desktopMode=${true} .topicId=${this.appStore.currentCategoryId || 1}></topic-page>
            </div>
          ` : ''}
        </div>

        <div class="desktop-right">
          <sheet-content .desktopMode=${true}></sheet-content>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
