import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { dataContext } from '../contexts/data-context.js';
import { AppStore } from '../stores/app-store.js';
import { DataStore, Category } from '../stores/data-store.js';
import { StoreController } from '../controllers/store-controller.js';

@customElement('sheet-content')
export class SheetContent extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @consume({ context: dataContext })
  dataStore!: DataStore;

  private storeController!: StoreController;
  private dataStoreController!: StoreController;

  static styles = css`
    :host {
      display: block;
      padding: 0 12px;
    }

    /* Topic cards - Figma design */
    .topic-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .topic-card {
      height: 208px;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .topic-card:active {
      transform: scale(0.98);
    }

    .topic-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
    }

    .topic-card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(29, 49, 111, 0.9);
      display: flex;
      padding: 20px 12px;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
    }

    .topic-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .topic-card-titles {
      color: white;
    }

    .topic-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 28px;
      line-height: 1.2;
      margin: 0;
    }

    .topic-card-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 28px;
      line-height: 1.2;
      margin: 0;
    }

    .topic-card-arrow {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .topic-card-arrow svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    .topic-card-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 15px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }

    /* Legacy category grid for impact */
    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .category-card {
      aspect-ratio: 1;
      background: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .category-card:hover,
    .category-card:active {
      border-color: #121212;
      transform: scale(1.02);
    }

    .category-icon {
      font-size: 2rem;
    }

    .category-name {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      color: #121212;
    }

    /* Month slider */
    .year-header {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: #4a9ad4;
      margin-bottom: 16px;
      padding-left: 12px;
      border-left: 4px solid #4a9ad4;
    }

    .month-grid-wrapper {
      margin: 0 -24px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .month-grid-wrapper::-webkit-scrollbar {
      display: none;
    }

    .month-grid {
      display: inline-flex;
      gap: 12px;
      padding: 0 24px 8px 24px;
      scroll-snap-type: x mandatory;
    }

    .month-card {
      flex-shrink: 0;
      width: 70px;
      height: 70px;
      background: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid rgba(0, 0, 0, 0.08);
      scroll-snap-align: start;
    }

    .month-card:hover,
    .month-card:active {
      border-color: #4a9ad4;
    }

    .month-card.active {
      border-color: #4a9ad4;
      border-width: 2px;
      background: #e8f4fc;
    }

    .month-num {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: #121212;
    }

    .month-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.65rem;
      color: #666;
    }

    /* Event cards */
    .schedule-events {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 24px;
    }

    .event-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 16px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.2s;
    }

    .event-card:active {
      transform: scale(0.98);
    }

    .event-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .event-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      color: #121212;
      border-left: 3px solid #4a9ad4;
      padding-left: 10px;
    }

    .event-date {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.8rem;
      color: #666;
      padding-left: 13px;
    }

    .event-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 0.8rem;
      color: #666;
      padding-left: 13px;
    }

    .event-image {
      width: 90px;
      height: 90px;
      border-radius: 8px;
      background: linear-gradient(135deg, #e8e8e8, #d0d0d0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      flex-shrink: 0;
      overflow: hidden;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      font-family: 'Noto Sans TC', sans-serif;
    }
  `;

  private months = [
    { en: 'Jan.' }, { en: 'Feb.' }, { en: 'Mar.' }, { en: 'Apr.' },
    { en: 'May' }, { en: 'Jun.' }, { en: 'Jul.' }, { en: 'Aug.' },
    { en: 'Sep.' }, { en: 'Oct.' }, { en: 'Nov.' }, { en: 'Dec.' }
  ];

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.dataStoreController = new StoreController(this, this.dataStore);
  }

  // Hardcoded topic data for UI (will be replaced with API data later)
  private topicCards = [
    {
      id: 1,
      title: '合作',
      subtitle: '當行動成為力量',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800'
    },
    {
      id: 2,
      title: '人文',
      subtitle: '讓歷史再翻新',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'
    },
    {
      id: 3,
      title: '祈福',
      subtitle: '讓善念被積累',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'
    }
  ];

  private handleCategoryClick(category: Category) {
    const type = category.type === 'topic' ? 'topics' : 'impact';
    this.appStore.openCategory(category.id, type);
  }

  private handleTopicClick(topicId: number) {
    this.appStore.openCategory(topicId, 'topics');
  }

  private handleMonthClick(month: number) {
    this.appStore.setSelectedMonth(month);
  }

  private renderTopics() {
    return html`
      <div class="topic-list">
        ${this.topicCards.map(topic => html`
          <div
            class="topic-card"
            @click=${() => this.handleTopicClick(topic.id)}
          >
            <div
              class="topic-card-bg"
              style="background-image: url('${topic.image}')"
            ></div>
            <div class="topic-card-overlay">
              <div class="topic-card-header">
                <div class="topic-card-titles">
                  <p class="topic-card-title">${topic.title}</p>
                  <p class="topic-card-subtitle">${topic.subtitle}</p>
                </div>
                <div class="topic-card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <p class="topic-card-desc">${topic.description}</p>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private renderSchedule() {
    const events = this.dataStore.events;
    const selectedMonth = this.appStore.selectedMonth;
    const selectedYear = this.appStore.selectedYear;

    return html`
      <h2 class="year-header">${selectedYear}</h2>
      <div class="month-grid-wrapper">
        <div class="month-grid">
          ${this.months.map((monthData, index) => html`
            <div
              class="month-card ${selectedMonth === index + 1 ? 'active' : ''}"
              @click=${() => this.handleMonthClick(index + 1)}
            >
              <span class="month-num">${index + 1}月</span>
              <span class="month-label">${monthData.en}</span>
            </div>
          `)}
        </div>
      </div>

      <div class="schedule-events">
        ${events.length > 0 ? events.map(event => html`
          <div class="event-card">
            <div class="event-info">
              <div class="event-title">${event.title}</div>
              <div class="event-date">
                📅 ${event.date_start}${event.date_end ? ` - ${event.date_end}` : ''}
              </div>
              ${event.tag ? html`<div class="event-tag">${event.tag}</div>` : ''}
            </div>
            <div class="event-image">
              <span>${event.icon || '📅'}</span>
            </div>
          </div>
        `) : html`
          <div class="empty-state">此月份暫無活動</div>
        `}
      </div>
    `;
  }

  private renderImpact() {
    const categories = this.dataStore.impactCategories;

    return html`
      <p class="section-title">選擇影響分類</p>
      <div class="category-grid">
        ${categories.map(cat => html`
          <div
            class="category-card"
            @click=${() => this.handleCategoryClick(cat)}
          >
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    const activeTab = this.appStore.activeTab;

    switch (activeTab) {
      case 'topics':
        return this.renderTopics();
      case 'schedule':
        return this.renderSchedule();
      case 'impact':
        return this.renderImpact();
      default:
        return this.renderTopics();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sheet-content': SheetContent;
  }
}
