import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { dataContext } from '../contexts/data-context.js';
import { appContext } from '../contexts/app-context.js';
import { DataStore } from '../stores/data-store.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, GalleryImage, Homepage } from '../services/api.js';

import './homepage-grid.js';
import './homepage-tabs.js';

@customElement('app-homepage')
export class AppHomepage extends LitElement {
  @consume({ context: dataContext })
  dataStore!: DataStore;

  @consume({ context: appContext })
  appStore!: AppStore;

  @state()
  private galleryImages: GalleryImage[] = [];

  @state()
  private homepage: Homepage | null = null;

  @state()
  private loading = true;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #0e2669;
      position: relative;
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 40px;
      flex: 1;
      padding-bottom: 60px;
    }

    .slogan {
      padding: 0 12px;
    }

    .slogan-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 54px;
      line-height: 1.1;
      letter-spacing: 1.62px;
      color: #e4ddd4;
    }

    .content {
      background-color: #e4ddd4;
      border-radius: 40px 40px 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
      flex: 1;
    }

    .text-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 80px 12px;
      width: 100%;
      box-sizing: border-box;
      color: #121212;
    }

    .title {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 20px;
      line-height: 1.6;
      margin: 0;
    }

    .description {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 15px;
      line-height: 1.4;
      margin: 0;
    }

    .copyright {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 430px;
      background-color: #121212;
      padding: 8px 12px;
      box-sizing: border-box;
    }

    .copyright-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.4;
      color: white;
      text-align: center;
      margin: 0;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #e4ddd4;
      font-family: 'Noto Sans TC', sans-serif;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadData();
  }

  private async loadData() {
    try {
      const [images, homepage] = await Promise.all([
        api.getGalleryRandom(15),
        api.getHomepage()
      ]);
      this.galleryImages = images;
      this.homepage = homepage;
    } catch (e) {
      console.error('Failed to load homepage data:', e);
    } finally {
      this.loading = false;
    }
  }

  private handleTabChange(e: CustomEvent<string>) {
    const tab = e.detail as 'topics' | 'schedule' | 'impact';
    this.appStore.setActiveTab(tab);
    // 這裡之後可以導航到對應頁面
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">載入中...</div>`;
    }

    return html`
      <div class="main">
        <homepage-grid .images=${this.galleryImages}></homepage-grid>

        <div class="slogan">
          <div class="slogan-text">
            ${this.homepage?.slogan?.split(' ').map((word, i) =>
              html`<div>${word}</div>`
            ) || html`<div>NGO 20</div><div>SLOGAN</div>`}
          </div>
        </div>

        <div class="content">
          <div class="text-section">
            <h2 class="title">${this.homepage?.title || '標題標題標題'}</h2>
            <p class="description">${this.homepage?.content || '內容載入中...'}</p>
          </div>

          <homepage-tabs
            .activeTab=${this.appStore.activeTab}
            @tab-change=${this.handleTabChange}
          ></homepage-tabs>
        </div>
      </div>

      <div class="copyright">
        <p class="copyright-text">
          Copyright © 2020 Open Source Matters. 版權所有. Copyright, OOO Foundation.
        </p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-homepage': AppHomepage;
  }
}
