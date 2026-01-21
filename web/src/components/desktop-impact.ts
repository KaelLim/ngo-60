import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ImpactSection } from '../services/api.js';

@customElement('desktop-impact')
export class DesktopImpact extends LitElement {
  @property({ type: Array })
  sections: ImpactSection[] = [];

  static styles = css`
    :host {
      display: block;
    }

    .section-container {
      padding: 40px;
    }

    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #0e2669;
      background: rgba(14, 38, 105, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      display: inline-block;
      margin-bottom: 24px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      align-items: start;
    }

    /* Left: Description */
    .description-section {
      padding: 24px 0;
    }

    .main-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 500;
      color: #121212;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }

    .main-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      color: #666;
      margin: 0;
      line-height: 1.6;
    }

    /* Right: Stats card */
    .stats-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .stats-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .stats-total {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      margin: 0 0 4px 0;
    }

    .stats-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 36px;
      font-weight: 600;
      color: #0e2669;
      margin: 0;
    }

    .stats-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #666;
      margin: 4px 0 0 0;
    }

    /* Simple visualization */
    .stats-visual {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 24px 0;
    }

    .stats-bar {
      width: 60px;
      height: 80px;
      background: rgba(14, 38, 105, 0.1);
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }

    .stats-bar-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #0e2669;
      border-radius: 8px;
      transition: height 0.5s ease-out;
    }

    .stats-bar-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #666;
      text-align: center;
      margin-top: 8px;
    }

    /* Tags */
    .stats-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
    }

    .stats-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #0e2669;
      background: rgba(14, 38, 105, 0.1);
      padding: 6px 14px;
      border-radius: 20px;
    }

    /* Stats row */
    .stats-row {
      display: flex;
      justify-content: space-around;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-bottom: 20px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-item-value {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 600;
      color: #0e2669;
      margin: 0;
    }

    .stat-item-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      color: #666;
      margin: 4px 0 0 0;
    }

    /* Report button */
    .report-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      border: 1px solid #0e2669;
      border-radius: 12px;
      background: transparent;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .report-button:hover {
      background: #0e2669;
      color: white;
    }

    .report-button:hover svg {
      color: white;
    }

    .report-button-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #0e2669;
    }

    .report-button:hover .report-button-text {
      color: white;
    }

    .report-button svg {
      width: 18px;
      height: 18px;
      color: #0e2669;
      transition: color 0.2s;
    }
  `;

  render() {
    // Sample data for visualization (can be made dynamic later)
    const totalEvents = '348,039';
    const tags = ['永續環境', '讓眾共善', '同片茶園'];
    const stats = [
      { value: '7,509', label: '名波及生' },
      { value: '60%', label: '女孩失學前識' }
    ];

    return html`
      <div class="section-container">
        <div class="section-title">看影響</div>

        <div class="content-grid">
          <!-- Left: Description -->
          <div class="description-section">
            <h2 class="main-title">慈濟 60 年帶來哪些影響？</h2>
            <p class="main-desc">
              我們用三個關鍵方向，回顧慈濟社會影響
            </p>
          </div>

          <!-- Right: Stats card -->
          <div class="stats-card">
            <div class="stats-header">
              <p class="stats-total">累計</p>
              <p class="stats-value">${totalEvents}</p>
              <p class="stats-label">場感恩活</p>
            </div>

            <div class="stats-tags">
              ${tags.map(tag => html`
                <span class="stats-tag">${tag}</span>
              `)}
            </div>

            <div class="stats-row">
              ${stats.map(stat => html`
                <div class="stat-item">
                  <p class="stat-item-value">${stat.value}</p>
                  <p class="stat-item-label">${stat.label}</p>
                </div>
              `)}
            </div>

            <button class="report-button">
              <span class="report-button-text">影響力報告</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M14 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-impact': DesktopImpact;
  }
}
