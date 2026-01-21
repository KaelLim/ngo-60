import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Event } from '../services/api.js';

@customElement('desktop-schedule')
export class DesktopSchedule extends LitElement {
  @property({ type: Array })
  events: Event[] = [];

  @property({ type: Number })
  selectedMonth = 4;

  @property({ type: Number })
  selectedYear = 2026;

  private months = [
    { num: 1, label: '1月', en: 'Jan.' },
    { num: 2, label: '2月', en: 'Feb.' },
    { num: 3, label: '3月', en: 'Mar.' },
    { num: 4, label: '4月', en: 'Apr.' },
    { num: 5, label: '5月', en: 'May' },
    { num: 6, label: '6月', en: 'Jun.' },
    { num: 7, label: '7月', en: 'Jul.' },
    { num: 8, label: '8月', en: 'Aug.' },
    { num: 9, label: '9月', en: 'Sep.' },
    { num: 10, label: '10月', en: 'Oct.' },
    { num: 11, label: '11月', en: 'Nov.' },
    { num: 12, label: '12月', en: 'Dec.' }
  ];

  static styles = css`
    :host {
      display: block;
    }

    .section-container {
      padding: 40px;
    }

    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: white;
      background: #121212;
      padding: 12px 24px;
      border-radius: 26px;
      display: inline-block;
      margin-bottom: 24px;
    }

    /* Year and Month selector */
    .date-selector {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
      background: white;
      border-radius: 16px;
      padding: 16px 24px;
    }

    .year-display {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: #121212;
    }

    .month-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .month-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .month-tab:hover {
      background: #f5f5f5;
    }

    .month-tab.active {
      background: #0e2669;
    }

    .month-tab.active .month-num,
    .month-tab.active .month-en {
      color: white;
    }

    .month-num {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #121212;
    }

    .month-en {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 11px;
      color: #999;
    }

    /* Event cards */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .event-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .event-card-image {
      width: 100%;
      height: 160px;
      background: #ddd;
      object-fit: cover;
    }

    .event-card-content {
      padding: 16px;
    }

    .event-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #121212;
      margin: 0 0 8px 0;
    }

    .event-card-date {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      color: #666;
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-card-date svg {
      width: 14px;
      height: 14px;
    }

    .event-card-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      color: #0e2669;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-card-tag svg {
      width: 12px;
      height: 12px;
    }

    .empty-message {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 16px;
    }
  `;

  private handleMonthClick(month: number) {
    this.dispatchEvent(new CustomEvent('month-change', {
      detail: { month, year: this.selectedYear },
      bubbles: true,
      composed: true
    }));
  }

  private formatDateRange(start: string, end: string | null): string {
    const startDate = new Date(start);
    const startMonth = startDate.getMonth() + 1;
    const startDay = startDate.getDate();

    if (!end) {
      return `${startMonth}.${startDay.toString().padStart(2, '0')}`;
    }

    const endDate = new Date(end);
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();

    return `${startMonth}.${startDay.toString().padStart(2, '0')} - ${endMonth}.${endDay.toString().padStart(2, '0')}`;
  }

  render() {
    return html`
      <div class="section-container">
        <div class="section-title">看時程</div>

        <div class="date-selector">
          <div class="year-display">${this.selectedYear}</div>
          <div class="month-tabs">
            ${this.months.map(month => html`
              <button
                class="month-tab ${month.num === this.selectedMonth ? 'active' : ''}"
                @click=${() => this.handleMonthClick(month.num)}
              >
                <span class="month-num">${month.label}</span>
                <span class="month-en">${month.en}</span>
              </button>
            `)}
          </div>
        </div>

        ${this.events.length > 0 ? html`
          <div class="events-grid">
            ${this.events.map(event => html`
              <div class="event-card">
                ${event.image_url ? html`
                  <img class="event-card-image" src=${event.image_url} alt=${event.title} />
                ` : html`
                  <div class="event-card-image"></div>
                `}
                <div class="event-card-content">
                  <h4 class="event-card-title">${event.title}</h4>
                  <p class="event-card-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    ${this.formatDateRange(event.date_start, event.date_end)}
                  </p>
                  <div class="event-card-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${event.participation_type || ''}
                  </div>
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="empty-message">此月份暫無活動</div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-schedule': DesktopSchedule;
  }
}
