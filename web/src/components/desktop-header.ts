import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { GalleryImage, api } from '../services/api.js';

@customElement('desktop-header')
export class DesktopHeader extends LitElement {
  @property({ type: Array })
  images: GalleryImage[] = [];

  @property({ type: String })
  slogan = 'NGO 60\nSLOGAN';

  // "6" shape empty positions (4x5 grid)
  // Row 0: x o o x
  // Row 1: o . . .
  // Row 2: x o o x
  // Row 3: o x x o
  // Row 4: x o o x
  private sixEmptyPositions = [0, 3, 5, 6, 7, 8, 11, 13, 14, 16, 19];

  // "0" shape empty positions (4x5 grid)
  // Row 0: x o o x
  // Row 1: o x x o
  // Row 2: o x x o
  // Row 3: o x x o
  // Row 4: x o o x
  private zeroEmptyPositions = [0, 3, 5, 6, 9, 10, 13, 14, 16, 19];

  static styles = css`
    :host {
      display: block;
    }

    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 60px;
      padding: 40px 0;
    }

    .grid-container {
      display: flex;
      gap: 40px;
    }

    .digit-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(5, 1fr);
      gap: 12px;
    }

    .circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      overflow: hidden;
      animation: circlePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }

    /* Staggered animation delays */
    .circle:nth-child(1) { animation-delay: 0.05s; }
    .circle:nth-child(2) { animation-delay: 0.08s; }
    .circle:nth-child(3) { animation-delay: 0.11s; }
    .circle:nth-child(4) { animation-delay: 0.14s; }
    .circle:nth-child(5) { animation-delay: 0.17s; }
    .circle:nth-child(6) { animation-delay: 0.20s; }
    .circle:nth-child(7) { animation-delay: 0.23s; }
    .circle:nth-child(8) { animation-delay: 0.26s; }
    .circle:nth-child(9) { animation-delay: 0.29s; }
    .circle:nth-child(10) { animation-delay: 0.32s; }
    .circle:nth-child(11) { animation-delay: 0.35s; }
    .circle:nth-child(12) { animation-delay: 0.38s; }
    .circle:nth-child(13) { animation-delay: 0.41s; }
    .circle:nth-child(14) { animation-delay: 0.44s; }
    .circle:nth-child(15) { animation-delay: 0.47s; }
    .circle:nth-child(16) { animation-delay: 0.50s; }
    .circle:nth-child(17) { animation-delay: 0.53s; }
    .circle:nth-child(18) { animation-delay: 0.56s; }
    .circle:nth-child(19) { animation-delay: 0.59s; }
    .circle:nth-child(20) { animation-delay: 0.62s; }

    @keyframes circlePopIn {
      from {
        opacity: 0;
        transform: scale(0);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
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
    }

    /* Hover effect */
    .circle {
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.25s ease;
    }

    .circle.has-image:hover {
      transform: scale(1.15);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      z-index: 10;
    }

    .slogan {
      flex: 1;
      text-align: right;
    }

    .slogan-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 64px;
      line-height: 1.1;
      letter-spacing: 2px;
      color: #e4ddd4;
      white-space: pre-line;
      animation: sloganFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
    }

    @keyframes sloganFadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 1200px) {
      .circle {
        width: 76px;
        height: 76px;
      }

      .digit-grid {
        gap: 15px;
      }

      .grid-container {
        gap: 60px;
      }

      .slogan-text {
        font-size: 72px;
      }
    }
  `;

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

  private renderDigitGrid(emptyPositions: number[], startIndex: number) {
    const cells = [];
    let imageIndex = startIndex;

    for (let i = 0; i < 20; i++) {
      const isEmpty = emptyPositions.includes(i);
      let image: GalleryImage | null = null;

      if (!isEmpty && this.images.length > 0) {
        image = this.images[imageIndex % this.images.length];
        imageIndex++;
      }

      cells.push(this.renderCircle(image, isEmpty));
    }

    return html`<div class="digit-grid">${cells}</div>`;
  }

  render() {
    // Count filled positions in "6"
    const sixFilledCount = 20 - this.sixEmptyPositions.length;

    return html`
      <div class="header-container">
        <div class="grid-container">
          ${this.renderDigitGrid(this.sixEmptyPositions, 0)}
          ${this.renderDigitGrid(this.zeroEmptyPositions, sixFilledCount)}
        </div>

        <div class="slogan">
          <div class="slogan-text">${this.slogan}</div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-header': DesktopHeader;
  }
}
