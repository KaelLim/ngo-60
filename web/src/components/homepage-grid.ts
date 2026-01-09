import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GalleryImage, api } from '../services/api.js';

@customElement('homepage-grid')
export class HomepageGrid extends LitElement {
  @property({ type: Array })
  images: GalleryImage[] = [];

  // 定義哪些位置是空白的 (0-indexed, row * 4 + col)
  // 根據 Figma 設計，有 5 個空白位置
  private emptyPositions = [5, 6, 7, 13, 14]; // row 2: col 2,3,4 / row 4: col 2,3

  static styles = css`
    :host {
      display: block;
      padding: 0 12px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 15px;
      height: 420px;
    }

    .circle {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      justify-self: center;
      align-self: center;
      overflow: hidden;
      position: relative;
    }

    .circle.empty {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .circle.has-image {
      background-color: #1a3a8a;
    }

    .circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }

    /* 動畫效果 */
    .circle {
      transition: transform 0.3s ease;
    }

    .circle:hover {
      transform: scale(1.05);
    }
  `;

  private getImageForPosition(position: number): GalleryImage | null {
    // 跳過空白位置
    if (this.emptyPositions.includes(position)) {
      return null;
    }

    // 計算實際的圖片索引（排除空白位置）
    let imageIndex = 0;
    for (let i = 0; i < position; i++) {
      if (!this.emptyPositions.includes(i)) {
        imageIndex++;
      }
    }

    return this.images[imageIndex] || null;
  }

  render() {
    const cells = [];

    for (let i = 0; i < 20; i++) {
      const image = this.getImageForPosition(i);
      const isEmpty = this.emptyPositions.includes(i);

      cells.push(html`
        <div class="circle ${isEmpty ? 'empty' : 'has-image'}">
          ${image ? html`
            <img
              src=${api.getGalleryImageUrl(image.filename)}
              alt=${image.original_name || ''}
              loading="lazy"
            />
          ` : ''}
        </div>
      `);
    }

    return html`<div class="grid">${cells}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'homepage-grid': HomepageGrid;
  }
}
