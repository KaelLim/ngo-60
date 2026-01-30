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
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .year-display {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 30px;
      font-weight: 500;
      color: #0e2669;
      width: 102px;
      text-align: center;
      flex-shrink: 0;
    }

    .month-tabs {
      display: flex;
      gap: 12px;
      height: 72px;
    }

    .month-tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      width: 64px;
      height: 72px;
      border: none;
      background: #f4f1ee;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .month-tab:hover {
      background: #e8e5e2;
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
      font-weight: 500;
      color: #121212;
      line-height: 1.2;
    }

    .month-num-value {
      font-size: 18px;
    }

    .month-num-label {
      font-size: 16px;
    }

    .month-en {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: #121212;
      line-height: 1.2;
    }

    .month-tab.active .month-num-value,
    .month-tab.active .month-num-label {
      color: white;
    }

    /* Event cards */
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .event-card {
      background: white;
      border-radius: 20px;
      padding: 20px 16px 20px 20px;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .event-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .event-card-info {
      display: flex;
      flex-direction: column;
      gap: 20px;
      flex: 1;
      min-width: 0;
    }

    .event-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: #121212;
      margin: 0;
      line-height: 1.28;
    }

    .event-card-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .event-card-date {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #121212;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 4px;
      line-height: 1;
    }

    .event-card-date svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .event-card-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #121212;
      display: flex;
      align-items: center;
      gap: 4px;
      line-height: 1;
    }

    .event-card-tag svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .event-card-image {
      width: 100px;
      height: 100px;
      border-radius: 12px;
      background: #f0f0f0;
      object-fit: cover;
      flex-shrink: 0;
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
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');

    if (!end) {
      return `${startMonth}.${startDay}`;
    }

    const endDate = new Date(end);
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');

    return `${startMonth}.${startDay} - ${endMonth}.${endDay}`;
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
                <span class="month-num">
                  <span class="month-num-value">${month.num} </span><span class="month-num-label">月</span>
                </span>
                <span class="month-en">${month.en}</span>
              </button>
            `)}
          </div>
        </div>

        ${this.events.length > 0 ? html`
          <div class="events-grid">
            ${this.events.map(event => html`
              <div class="event-card">
                <div class="event-card-info">
                  <h4 class="event-card-title">${event.title}</h4>
                  <div class="event-card-items">
                    <p class="event-card-date">
                      <svg viewBox="0 0 18 18" fill="none">
                        <path d="M15.75 15V4.5C15.75 3.67275 15.0773 3 14.25 3H12.75V1.5H11.25V3H6.75V1.5H5.25V3H3.75C2.92275 3 2.25 3.67275 2.25 4.5V15C2.25 15.8273 2.92275 16.5 3.75 16.5H14.25C15.0773 16.5 15.75 15.8273 15.75 15ZM6.75 13.5H5.25V12H6.75V13.5ZM6.75 10.5H5.25V9H6.75V10.5ZM9.75 13.5H8.25V12H9.75V13.5ZM9.75 10.5H8.25V9H9.75V10.5ZM12.75 13.5H11.25V12H12.75V13.5ZM12.75 10.5H11.25V9H12.75V10.5ZM14.25 6.75H3.75V5.25H14.25V6.75Z" fill="#c4beb6"/>
                      </svg>
                      ${this.formatDateRange(event.date_start, event.date_end)}
                    </p>
                    ${event.participation_type ? html`
                      <div class="event-card-tag">
                        <svg viewBox="0 0 18 18" fill="none">
                          <path d="M9 1.5C9.825 1.5 10.5 2.175 10.5 3C10.5 3.825 9.825 4.5 9 4.5C8.175 4.5 7.5 3.825 7.5 3C7.5 2.175 8.175 1.5 9 1.5ZM11.925 6.075C11.625 5.775 11.1 5.25 10.125 5.25H8.25C6.15 5.25 4.5 3.6 4.5 1.5H3C3 3.9 4.575 5.85 6.75 6.525V16.5H8.25V12H9.75V16.5H11.25V7.575L14.25 10.5L15.3 9.45L11.925 6.075Z" fill="#c4beb6"/>
                        </svg>
                        ${event.participation_type}
                      </div>
                    ` : ''}
                  </div>
                </div>
                ${event.image_url ? html`
                  <img class="event-card-image" src=${event.image_url} alt=${event.title} />
                ` : html`
                  <div class="event-card-image"></div>
                `}
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
