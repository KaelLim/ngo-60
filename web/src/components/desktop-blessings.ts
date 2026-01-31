import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Blessing } from '../services/api.js';

@customElement('desktop-blessings')
export class DesktopBlessings extends LitElement {
  @property({ type: Array })
  blessings: Blessing[] = [];

  @state()
  private currentIndex = 0;

  private get visibleCount() {
    return 3;
  }

  private get maxIndex() {
    return Math.max(0, this.blessings.length - this.visibleCount);
  }

  private get progressRatio() {
    if (this.maxIndex === 0) return 1;
    return (this.currentIndex + this.visibleCount) / this.blessings.length;
  }

  static styles = css`
    :host {
      display: block;
    }

    .blessings-container {
      background: #0e2669;
      padding: 60px 40px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      overflow: hidden;
    }

    .card {
      background: white;
      border-radius: 20px;
      padding: 20px 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 20px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .card-title {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 0 20px;
    }

    .card-author {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: black;
      line-height: 1.25;
      flex: 1;
    }

    .card-photo {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f0f0f0;
    }

    .card-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-body {
      padding: 0 20px;
    }

    .card-message {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #8e8e93;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .carousel-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .arrow-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .arrow-btn:hover {
      opacity: 1;
    }

    .arrow-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .arrow-btn svg {
      width: 20px;
      height: 20px;
      fill: #e4ddd4;
    }

    .progress-bar {
      flex: 1;
      height: 2px;
      background: rgba(228, 221, 212, 0.4);
      border-radius: 8px;
      position: relative;
    }

    .progress-fill {
      height: 2px;
      background: #e4ddd4;
      border-radius: 8px;
      transition: width 0.3s ease;
    }
  `;

  private prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  private next() {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
    }
  }

  private handleCardClick(blessing: Blessing) {
    this.dispatchEvent(new CustomEvent<number>('blessing-click', {
      detail: blessing.id,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.blessings.length) return html``;

    const visibleBlessings = this.blessings.slice(
      this.currentIndex,
      this.currentIndex + this.visibleCount
    );

    return html`
      <div class="blessings-container">
        <div class="cards">
          ${visibleBlessings.map(b => html`
            <div class="card" @click=${() => this.handleCardClick(b)}>
              <div class="card-title">
                <span class="card-author">${b.author}</span>
                ${b.image_url ? html`
                  <div class="card-photo">
                    <img src="${b.image_url}" alt="${b.author}" />
                  </div>
                ` : html``}
              </div>
              <div class="card-body">
                <p class="card-message">${b.full_content || b.message}</p>
              </div>
            </div>
          `)}
        </div>

        <div class="carousel-controls">
          <button class="arrow-btn" @click=${this.prev} ?disabled=${this.currentIndex === 0}>
            <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.progressRatio * 100}%"></div>
          </div>
          <button class="arrow-btn" @click=${this.next} ?disabled=${this.currentIndex >= this.maxIndex}>
            <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-blessings': DesktopBlessings;
  }
}
