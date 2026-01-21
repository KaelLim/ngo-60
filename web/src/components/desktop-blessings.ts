import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Blessing } from '../services/api.js';

@customElement('desktop-blessings')
export class DesktopBlessings extends LitElement {
  @property({ type: Array })
  blessings: Blessing[] = [];

  static styles = css`
    :host {
      display: block;
    }

    .section-container {
      padding: 40px;
    }

    .section-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: #121212;
      margin: 0 0 8px 0;
    }

    /* Blessing tags cloud */
    .blessing-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-bottom: 40px;
    }

    .blessing-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #121212;
      background: white;
      padding: 10px 20px;
      border-radius: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
    }

    .blessing-tag:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      background: #0e2669;
      color: white;
    }

    /* Featured blessing cards */
    .blessing-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .blessing-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .blessing-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .blessing-card-image {
      width: 100%;
      height: 140px;
      background: #ddd;
      object-fit: cover;
    }

    .blessing-card-content {
      padding: 20px;
    }

    .blessing-card-author {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #121212;
      margin: 0 0 12px 0;
    }

    .blessing-card-message {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    @media (max-width: 900px) {
      .blessing-cards {
        grid-template-columns: 1fr;
      }
    }
  `;

  private handleBlessingClick(blessingId: number) {
    this.dispatchEvent(new CustomEvent('blessing-click', {
      detail: blessingId,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    // Separate featured and regular blessings
    const featuredBlessings = this.blessings.filter(b => b.is_featured).slice(0, 3);
    const tagBlessings = this.blessings.filter(b => !b.is_featured);

    // Sample blessing tags if not enough data
    const sampleTags = [
      '讓愛傳出所需要幫助的人',
      '惜父母相同希望',
      '願善惡人員皆是平安',
      '志工力推進境界社會',
      '科技守護台灣同胞世界',
      '讓善心愛幫助尋訪的人家道德',
      '懷孕為愛也讓悲愁一份力量',
      '祈願大家海溫馨幸福滿人義依',
      'Just Do It!'
    ];

    const displayTags = tagBlessings.length > 0
      ? tagBlessings.map(b => b.message)
      : sampleTags;

    return html`
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">道場對慈濟 60 的祝福！</h2>
        </div>

        <!-- Blessing tags -->
        <div class="blessing-tags">
          ${displayTags.map((tag, index) => html`
            <span
              class="blessing-tag"
              @click=${() => tagBlessings[index] && this.handleBlessingClick(tagBlessings[index].id)}
            >
              ${tag}
            </span>
          `)}
        </div>

        <!-- Featured blessing cards -->
        ${featuredBlessings.length > 0 ? html`
          <div class="blessing-cards">
            ${featuredBlessings.map(blessing => html`
              <div class="blessing-card" @click=${() => this.handleBlessingClick(blessing.id)}>
                ${blessing.image_url ? html`
                  <img class="blessing-card-image" src=${blessing.image_url} alt=${blessing.author} />
                ` : html`
                  <div class="blessing-card-image"></div>
                `}
                <div class="blessing-card-content">
                  <h3 class="blessing-card-author">${blessing.author}</h3>
                  <p class="blessing-card-message">${blessing.message}</p>
                </div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-blessings': DesktopBlessings;
  }
}
