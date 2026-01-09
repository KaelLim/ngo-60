import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { dataContext } from '../contexts/data-context.js';
import { DataStore } from '../stores/data-store.js';
import { api, GalleryImage, Homepage } from '../services/api.js';

import './homepage-grid.js';

@customElement('app-poster')
export class AppPoster extends LitElement {
  @consume({ context: dataContext })
  dataStore!: DataStore;

  @state()
  private galleryImages: GalleryImage[] = [];

  @state()
  private homepage: Homepage | null = null;

  @state()
  private loading = true;

  static styles = css`
    :host {
      display: block;
    }

    .poster-section {
      height: calc(var(--vh, 1vh) * 92);
      background: linear-gradient(180deg, #0e2669 0%, #0a1d52 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 20px 0 40px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .grid-container {
      flex-shrink: 0;
    }

    .slogan {
      padding: 0 12px;
      flex-shrink: 0;
    }

    .slogan-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 54px;
      line-height: 1.1;
      letter-spacing: 1.62px;
      color: #e4ddd4;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #e4ddd4;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 1rem;
    }

    /* Decorative circles */
    .decoration {
      position: absolute;
      border: 1px solid rgba(228, 221, 212, 0.1);
      border-radius: 50%;
      pointer-events: none;
    }

    .decoration-1 {
      width: 300px;
      height: 300px;
      bottom: -100px;
      right: -100px;
      animation: pulse 4s ease-in-out infinite;
    }

    .decoration-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      left: -50px;
      animation: pulse 4s ease-in-out infinite 0.5s;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.05); }
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
      console.error('Failed to load poster data:', e);
    } finally {
      this.loading = false;
    }
  }

  render() {
    if (this.loading) {
      return html`
        <section class="poster-section">
          <div class="loading">載入中...</div>
        </section>
      `;
    }

    const sloganWords = this.homepage?.slogan?.split(' ') || ['NGO', '20'];

    return html`
      <section class="poster-section">
        <div class="decoration decoration-1"></div>
        <div class="decoration decoration-2"></div>

        <div class="grid-container">
          <homepage-grid .images=${this.galleryImages}></homepage-grid>
        </div>

        <div class="slogan">
          <div class="slogan-text">
            ${sloganWords.map(word => html`<div>${word}</div>`)}
          </div>
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-poster': AppPoster;
  }
}
