import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GalleryImage, api } from '../services/api.js';

@customElement('homepage-grid')
export class HomepageGrid extends LitElement {
  @property({ type: Array })
  images: GalleryImage[] = [];

  @property({ type: Boolean, reflect: true })
  desktopMode = false;

  // Mobile: 定義哪些位置是空白的 (0-indexed, row * 4 + col)
  private mobileEmptyPositions = [5, 6, 7, 13, 14]; // row 2: col 2,3,4 / row 4: col 2,3

  // Desktop "6" shape empty positions (4x5 grid)
  // Row 0: O O O O   (all filled)
  // Row 1: O . . .   (right 3 empty)
  // Row 2: O O O O   (all filled)
  // Row 3: O . . O   (middle 2 empty)
  // Row 4: O O O O   (all filled)
  private sixEmptyPositions = [5, 6, 7, 13, 14];

  // Desktop "0" shape empty positions (4x5 grid)
  // Row 0: O O O O   (all filled)
  // Row 1: O . . O   (middle 2 empty)
  // Row 2: O . . O   (middle 2 empty)
  // Row 3: O . . O   (middle 2 empty)
  // Row 4: O O O O   (all filled)
  private zeroEmptyPositions = [5, 6, 9, 10, 13, 14];

  static styles = css`
    :host {
      display: block;
      padding: 0 12px;
    }

    /* Mobile grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 15px;
      height: 420px;
    }

    /* Desktop grid container */
    .desktop-grid-container {
      display: none;
    }

    :host([desktopMode]) .grid {
      display: none;
    }

    :host([desktopMode]) .desktop-grid-container {
      display: flex;
      gap: 40px;
      justify-content: center;
      align-items: center;
    }

    .digit-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 12px;
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
      transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease,
        filter 0.25s ease;
    }

    .circle.has-image:hover {
      transform: scale(1.15);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      z-index: 10;
    }

    .circle.has-image:active {
      transform: scale(1.05);
    }

    .circle.empty:hover {
      transform: scale(1.08);
      background-color: rgba(255, 255, 255, 0.25);
    }

    /* Desktop larger circles */
    :host([desktopMode]) .circle {
      width: 64px;
      height: 64px;
    }

    @media (min-width: 1200px) {
      :host([desktopMode]) .circle {
        width: 76px;
        height: 76px;
      }

      :host([desktopMode]) .digit-grid {
        gap: 15px;
      }

      :host([desktopMode]) .desktop-grid-container {
        gap: 60px;
      }
    }
  `;

  private getImageForPosition(position: number, emptyPositions: number[]): GalleryImage | null {
    if (emptyPositions.includes(position)) {
      return null;
    }

    // Calculate image index excluding empty positions
    let imageIndex = 0;
    for (let i = 0; i < position; i++) {
      if (!emptyPositions.includes(i)) {
        imageIndex++;
      }
    }

    return this.images[imageIndex] || null;
  }

  private renderCircle(image: GalleryImage | null, isEmpty: boolean) {
    return html`
      <div class="circle ${isEmpty ? 'empty' : 'has-image'}">
        ${image ? html`
          <img
            src=${api.getGalleryImageUrl(image.filename)}
            alt=${image.original_name || ''}
            loading="lazy"
          />
        ` : ''}
      </div>
    `;
  }

  private renderMobileGrid() {
    const cells = [];
    for (let i = 0; i < 20; i++) {
      const image = this.getImageForPosition(i, this.mobileEmptyPositions);
      const isEmpty = this.mobileEmptyPositions.includes(i);
      cells.push(this.renderCircle(image, isEmpty));
    }
    return html`<div class="grid">${cells}</div>`;
  }

  private renderDesktopGrid() {
    if (this.images.length === 0) {
      return html`<div class="desktop-grid-container"></div>`;
    }

    let imageIndex = 0;

    // Create "6" digit
    const sixCells = [];
    for (let i = 0; i < 20; i++) {
      const isEmpty = this.sixEmptyPositions.includes(i);
      let image: GalleryImage | null = null;
      if (!isEmpty) {
        // Cycle through images if not enough
        image = this.images[imageIndex % this.images.length];
        imageIndex++;
      }
      sixCells.push(this.renderCircle(image, isEmpty));
    }

    // Create "0" digit
    const zeroCells = [];
    for (let i = 0; i < 20; i++) {
      const isEmpty = this.zeroEmptyPositions.includes(i);
      let image: GalleryImage | null = null;
      if (!isEmpty) {
        // Cycle through images if not enough
        image = this.images[imageIndex % this.images.length];
        imageIndex++;
      }
      zeroCells.push(this.renderCircle(image, isEmpty));
    }

    return html`
      <div class="desktop-grid-container">
        <div class="digit-grid">${sixCells}</div>
        <div class="digit-grid">${zeroCells}</div>
      </div>
    `;
  }

  render() {
    return html`
      ${this.renderMobileGrid()}
      ${this.renderDesktopGrid()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'homepage-grid': HomepageGrid;
  }
}
