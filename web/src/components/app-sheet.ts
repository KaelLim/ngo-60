import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { dataContext } from '../contexts/data-context.js';
import { AppStore, TabType } from '../stores/app-store.js';
import { DataStore } from '../stores/data-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, Homepage } from '../services/api.js';

import './homepage-tabs.js';
import './sheet-content.js';

@customElement('app-sheet')
export class AppSheet extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @consume({ context: dataContext })
  dataStore!: DataStore;

  private storeController!: StoreController<AppStore>;

  @state()
  private homepage: Homepage | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .sheet-section {
      min-height: calc(var(--vh, 1vh) * 100);
      background: #e4ddd4;
      border-radius: 40px 40px 0 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: border-radius 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sheet-section.full {
      border-radius: 0;
    }

    /* Preview area wrapper - fits within visible 25vh */
    .preview-area {
      height: calc(var(--vh, 1vh) * 25);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 32px 24px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .preview-area.visible {
      opacity: 1;
    }

    .preview-area.hidden {
      display: none;
    }

    .preview-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: #121212;
    }

    .preview-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.5;
    }

    .preview-tabs {
      padding: 0 0;
    }

    /* Homepage content - visible in full state */
    .homepage-content {
      flex: 1 1 0;
      height: 0;
      overflow-y: scroll;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .homepage-content.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .homepage-content::-webkit-scrollbar {
      display: none;
    }

    /* Tab bar container in full mode */
    .tab-container {
      padding: 0 12px 24px;
      margin-top: 20px;
      background: #e4ddd4;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .content-inner {
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.loadHomepage();
  }

  private async loadHomepage() {
    try {
      this.homepage = await api.getHomepage();
    } catch (e) {
      console.error('Failed to load homepage:', e);
    }
  }

  private handleTabChange(e: CustomEvent<string>) {
    const tab = e.detail as TabType;
    this.appStore.setActiveTab(tab);
  }

  render() {
    const sheetState = this.appStore.sheetState;
    const isPreview = sheetState === 'preview';
    const isFull = sheetState === 'full';

    return html`
      <section class="sheet-section ${isFull ? 'full' : ''}">
        <!-- Preview area - fits within 25vh -->
        <div class="preview-area ${isPreview ? 'visible' : 'hidden'}">
          <div class="preview-text">
            <h2 class="preview-title">${this.homepage?.title || '探索精彩活動'}</h2>
            <p class="preview-desc">
              ${this.homepage?.content || '瀏覽各類型活動、時程安排，以及活動所帶來的影響與改變。'}
            </p>
          </div>
          <div class="preview-tabs">
            <homepage-tabs
              .activeTab=${this.appStore.activeTab}
              @tab-change=${this.handleTabChange}
            ></homepage-tabs>
          </div>
        </div>

        <!-- Homepage content for full state -->
        <div class="homepage-content ${isFull ? 'visible' : ''}">
          <!-- Sticky tab bar -->
          <div class="tab-container">
            <homepage-tabs
              .activeTab=${this.appStore.activeTab}
              @tab-change=${this.handleTabChange}
            ></homepage-tabs>
          </div>

          <!-- Tab content -->
          <div class="content-inner">
            <sheet-content></sheet-content>
          </div>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-sheet': AppSheet;
  }
}
