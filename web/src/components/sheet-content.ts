import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { dataContext } from '../contexts/data-context.js';
import { AppStore } from '../stores/app-store.js';
import { DataStore, Category } from '../stores/data-store.js';
import { StoreController } from '../controllers/store-controller.js';

type TopicStyle = 'v1' | 'v2';

@customElement('sheet-content')
export class SheetContent extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @consume({ context: dataContext })
  dataStore!: DataStore;

  @state()
  private topicStyle: TopicStyle = 'v2';

  private storeController!: StoreController;
  private dataStoreController!: StoreController;

  static styles = css`
    :host {
      display: block;
      padding: 0 12px;
      position: relative;
    }

    /* Style toggle button */
    .style-toggle {
      position: fixed;
      bottom: 100px;
      left: 20px;
      z-index: 100;
      background: #121212;
      color: white;
      border: none;
      border-radius: 20px;
      padding: 8px 16px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }

    .style-toggle:active {
      transform: scale(0.95);
    }

    /* ========== V1: Full overlay style ========== */
    .topic-list.v1 .topic-card {
      height: 208px;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .topic-list.v1 .topic-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
    }

    .topic-list.v1 .topic-card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(29, 49, 111, 0.9);
      display: flex;
      padding: 20px 12px;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
    }

    .topic-list.v1 .topic-card-title {
      font-size: 28px;
    }

    .topic-list.v1 .topic-card-subtitle {
      font-size: 28px;
    }

    /* ========== V2: Split layout style ========== */
    .topic-list.v2 .topic-card {
      height: 208px;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
      background: #0e2669;
    }

    .topic-list.v2 .topic-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.8;
    }

    .topic-list.v2 .topic-card-overlay {
      position: absolute;
      top: 0;
      right: 0;
      width: 258px;
      height: 208px;
      background: rgba(14, 38, 105, 0.9);
      display: flex;
      padding: 20px 16px;
      flex-direction: column;
      gap: 48px;
      align-items: flex-end;
      overflow: hidden;
    }

    .topic-list.v2 .topic-card-title {
      font-size: 24px;
    }

    .topic-list.v2 .topic-card-subtitle {
      font-size: 24px;
    }

    /* ========== Shared topic card styles ========== */
    .topic-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .topic-card:active {
      transform: scale(0.98);
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
      line-height: 1.2;
      margin: 0;
    }

    .topic-card-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
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
      text-align: left;
      width: 100%;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    /* ========== Impact Tab Styles ========== */
    .impact-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 4px 0;
    }

    /* Report Section */
    .impact-report {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .impact-title-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .impact-main-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: black;
      line-height: 1.25;
      margin: 0;
    }

    .impact-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #7d7d7d;
      line-height: 1.25;
      margin: 0;
    }

    /* Report Card */
    .impact-report-card {
      background: #0e2669;
      border-radius: 20px;
      height: 351px;
      position: relative;
      overflow: hidden;
    }

    .impact-graphic {
      position: absolute;
      top: 32px;
      left: 28px;
      width: 303px;
      height: 220px;
    }

    .impact-triangle {
      position: absolute;
      left: 57px;
      top: 40px;
      width: 180px;
      height: 180px;
    }

    .impact-triangle svg {
      width: 100%;
      height: 100%;
    }

    /* Impact nodes */
    .impact-node {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .impact-node.top {
      top: 0;
      left: 78px;
      width: 138px;
    }

    .impact-node.bottom-left {
      top: 149px;
      left: 0;
      width: 120px;
    }

    .impact-node.bottom-right {
      top: 149px;
      left: 166px;
      width: 137px;
    }

    .impact-node-badge {
      background: #0e2669;
      padding: 8px;
      border-radius: 30px;
    }

    .impact-node-inner {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 14px;
      border-radius: 20px;
      box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4);
    }

    .impact-node-inner span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 500;
      color: white;
      line-height: 1.2;
    }

    .impact-node-stat {
      display: flex;
      gap: 4px;
      align-items: baseline;
      color: white;
      font-family: 'Noto Sans TC', sans-serif;
      width: 100%;
    }

    .impact-node-stat .label {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
    }

    .impact-node-stat .value {
      font-size: 16px;
      font-weight: 400;
      line-height: 1;
    }

    .impact-node-stat .unit {
      font-size: 12px;
      font-weight: 400;
      line-height: 1.2;
    }

    /* Report buttons */
    .impact-buttons {
      position: absolute;
      bottom: 20px;
      left: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .impact-report-btn {
      background: white;
      border: none;
      border-radius: 24px;
      width: 251px;
      height: 48px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: black;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .impact-report-btn:active {
      transform: scale(0.98);
    }

    .impact-link-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .impact-link-btn:active {
      transform: scale(0.95);
    }

    .impact-link-btn svg {
      width: 24px;
      height: 24px;
    }

    /* Bless Section */
    .bless-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bless-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: black;
      line-height: 1.25;
      margin: 0;
    }

    .bless-cards-wrapper {
      margin: 0 -12px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .bless-cards-wrapper::-webkit-scrollbar {
      display: none;
    }

    .bless-cards {
      display: inline-flex;
      gap: 12px;
      padding: 0 12px;
    }

    .bless-card {
      flex-shrink: 0;
      width: 271px;
      height: 267px;
      background: white;
      border: 1px solid #e8e8e8;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
    }

    /* Dialog bubbles card */
    .bless-dialogs {
      position: absolute;
      top: 17px;
      right: 13px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .bless-dialog {
      display: flex;
      align-items: center;
    }

    .bless-dialog-bubble {
      background: #e4ddd4;
      padding: 0 12px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bless-dialog-bubble.highlight {
      background: #0e2669;
    }

    .bless-dialog-bubble span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: black;
      line-height: 1.25;
    }

    .bless-dialog-bubble.highlight span {
      color: white;
    }

    .bless-dialog-pointer {
      width: 12px;
      height: 16px;
      margin-left: -4px;
    }

    .bless-dialog-pointer svg {
      width: 100%;
      height: 100%;
    }

    /* Photo card */
    .bless-photo-card {
      border: none;
      cursor: pointer;
    }

    .bless-photo-card img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .bless-photo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, transparent 25%, rgba(0, 0, 0, 0.7) 100%);
      border-radius: 20px;
    }

    .bless-photo-text {
      position: absolute;
      bottom: 24px;
      left: 20px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: white;
      line-height: 1.2;
    }

    /* ========== Schedule Tab Styles ========== */
    .schedule-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .year-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .year-header {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 26px;
      font-weight: 700;
      color: #0e2669;
      line-height: 1.2;
      margin: 0;
    }

    .month-grid-wrapper {
      margin: 0 -12px;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .month-grid-wrapper::-webkit-scrollbar {
      display: none;
    }

    .month-grid {
      display: inline-flex;
      gap: 8px;
      padding: 0 12px 8px 12px;
    }

    .month-card {
      flex-shrink: 0;
      width: 60px;
      height: 72px;
      background: white;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
      color: #121212;
    }

    .month-card:active {
      transform: scale(0.95);
    }

    .month-card.active {
      background: #0e2669;
      color: white;
    }

    .month-num {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      line-height: 1.2;
    }

    .month-num span {
      font-size: 16px;
    }

    .month-label {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.2;
    }

    /* Event cards */
    .schedule-events {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .event-card {
      background: white;
      border-radius: 20px;
      padding: 20px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .event-card:active {
      transform: scale(0.98);
    }

    .event-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 187px;
    }

    .event-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #121212;
      line-height: 1.28;
      margin: 0;
    }

    .event-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .event-icon svg {
      width: 100%;
      height: 100%;
    }

    .event-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #121212;
      line-height: 16px;
    }

    .event-image {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      background: #f5f5f5;
      flex-shrink: 0;
      overflow: hidden;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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

  private toggleTopicStyle() {
    this.topicStyle = this.topicStyle === 'v1' ? 'v2' : 'v1';
  }

  private renderTopics() {
    return html`
      <div class="topic-list ${this.topicStyle}">
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
      <button class="style-toggle" @click=${this.toggleTopicStyle}>
        風格: ${this.topicStyle === 'v1' ? '全覆蓋' : '分割式'}
      </button>
    `;
  }

  // Hardcoded schedule events for UI (will be replaced with API data later)
  private scheduleEvents = [
    {
      id: 1,
      title: '線上浴佛',
      date_start: '2026.08.28',
      date_end: '2026.09.05',
      participation: '線上參與-免費',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400'
    },
    {
      id: 2,
      title: '亞太永續博覽會',
      date_start: '2026.08.28',
      date_end: '2026.09.05',
      participation: '現場參與-需購票',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'
    },
    {
      id: 3,
      title: '精舍過新年',
      date_start: '2026.08.28',
      date_end: '2026.09.05',
      participation: '現場參與-免費',
      image: 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=400'
    }
  ];

  private renderSchedule() {
    const selectedMonth = this.appStore.selectedMonth;
    const selectedYear = this.appStore.selectedYear;

    // Calendar icon SVG
    const calendarIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M15.75 15V4.5C15.75 3.67275 15.0773 3 14.25 3H12.75V1.5H11.25V3H6.75V1.5H5.25V3H3.75C2.92275 3 2.25 3.67275 2.25 4.5V15C2.25 15.8273 2.92275 16.5 3.75 16.5H14.25C15.0773 16.5 15.75 15.8273 15.75 15ZM6.75 13.5H5.25V12H6.75V13.5ZM6.75 10.5H5.25V9H6.75V10.5ZM9.75 13.5H8.25V12H9.75V13.5ZM9.75 10.5H8.25V9H9.75V10.5ZM12.75 13.5H11.25V12H12.75V13.5ZM12.75 10.5H11.25V9H12.75V10.5ZM14.25 6.75H3.75V5.25H14.25V6.75Z" fill="#5FB7FA"/>
      </svg>
    `;

    // Person/participation icon SVG
    const personIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C9.825 1.5 10.5 2.175 10.5 3C10.5 3.825 9.825 4.5 9 4.5C8.175 4.5 7.5 3.825 7.5 3C7.5 2.175 8.175 1.5 9 1.5ZM11.925 6.075C11.625 5.775 11.1 5.25 10.125 5.25H8.25C6.15 5.25 4.5 3.6 4.5 1.5H3C3 3.9 4.575 5.85 6.75 6.525V16.5H8.25V12H9.75V16.5H11.25V7.575L14.25 10.5L15.3 9.45L11.925 6.075Z" fill="#5FB7FA"/>
      </svg>
    `;

    return html`
      <div class="schedule-container">
        <div class="year-section">
          <h2 class="year-header">${selectedYear}</h2>
          <div class="month-grid-wrapper">
            <div class="month-grid">
              ${this.months.map((monthData, index) => html`
                <div
                  class="month-card ${selectedMonth === index + 1 ? 'active' : ''}"
                  @click=${() => this.handleMonthClick(index + 1)}
                >
                  <span class="month-num">${index + 1} <span>月</span></span>
                  <span class="month-label">${monthData.en}</span>
                </div>
              `)}
            </div>
          </div>
        </div>

        <div class="schedule-events">
          ${this.scheduleEvents.length > 0 ? this.scheduleEvents.map(event => html`
            <div class="event-card">
              <div class="event-info">
                <p class="event-title">${event.title}</p>
                <div class="event-items">
                  <div class="event-row">
                    <span class="event-icon">${calendarIcon}</span>
                    <span class="event-text">${event.date_start}${event.date_end ? ` - ${event.date_end}` : ''}</span>
                  </div>
                  <div class="event-row">
                    <span class="event-icon">${personIcon}</span>
                    <span class="event-text">${event.participation}</span>
                  </div>
                </div>
              </div>
              <div class="event-image">
                <img src="${event.image}" alt="${event.title}" />
              </div>
            </div>
          `) : html`
            <div class="empty-state">此月份暫無活動</div>
          `}
        </div>
      </div>
    `;
  }

  // Hardcoded bless messages for UI
  private blessMessages = [
    { text: '謝謝陪伴需要幫助的人', highlight: false },
    { text: '陪災民找回希望', highlight: false },
    { text: '願醫護人員健康平安', highlight: true },
    { text: '讓善心善款都能化為溫暖', highlight: false },
    { text: '持續守護台灣與世界', highlight: false }
  ];

  private renderImpact() {
    // Triangle SVG connecting three nodes
    const triangleSvg = html`
      <svg viewBox="0 0 150 133" fill="none">
        <path d="M75 0 L150 133 L0 133 Z" stroke="#5fb7fa" stroke-width="2" fill="none"/>
      </svg>
    `;

    // Arrow icon for external link
    const arrowIcon = html`
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#121212" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Dialog pointer SVG (triangle)
    const pointerSvg = (highlight: boolean) => html`
      <svg viewBox="0 0 12 16" fill="none">
        <path d="M0 8L12 0V16L0 8Z" fill="${highlight ? '#0e2669' : '#e4ddd4'}"/>
      </svg>
    `;

    return html`
      <div class="impact-container">
        <!-- Report Section -->
        <div class="impact-report">
          <div class="impact-title-section">
            <h2 class="impact-main-title">慈濟 60 年帶來哪些影響？</h2>
            <p class="impact-subtitle">慈濟用三大主軸回應臺灣社會脈絡</p>
          </div>

          <div class="impact-report-card">
            <div class="impact-graphic">
              <!-- Triangle connecting three points -->
              <div class="impact-triangle">
                ${triangleSvg}
              </div>

              <!-- Top node: 永續環境 -->
              <div class="impact-node top">
                <div class="impact-node-stat">
                  <span class="label">降低</span>
                  <span class="value">348,039</span>
                  <span class="unit">噸碳排放</span>
                </div>
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>永續環境</span>
                  </div>
                </div>
              </div>

              <!-- Bottom left node: 深耕共伴 -->
              <div class="impact-node bottom-left">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>深耕共伴</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">培訓</span>
                  <span class="value">7,509</span>
                  <span class="unit">名防災士</span>
                </div>
              </div>

              <!-- Bottom right node: 向光家園 -->
              <div class="impact-node bottom-right">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>向光家園</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">驅動</span>
                  <span class="value">80%</span>
                  <span class="unit">災民利他意願</span>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="impact-buttons">
              <button class="impact-report-btn">影響力報告</button>
              <button class="impact-link-btn">
                ${arrowIcon}
              </button>
            </div>
          </div>
        </div>

        <!-- Bless Section -->
        <div class="bless-section">
          <h3 class="bless-title">祝福與期許</h3>
          <div class="bless-cards-wrapper">
            <div class="bless-cards">
              <!-- Dialog bubbles card -->
              <div class="bless-card">
                <div class="bless-dialogs">
                  ${this.blessMessages.map(msg => html`
                    <div class="bless-dialog">
                      <div class="bless-dialog-bubble ${msg.highlight ? 'highlight' : ''}">
                        <span>${msg.text}</span>
                      </div>
                      <div class="bless-dialog-pointer">
                        ${pointerSvg(msg.highlight)}
                      </div>
                    </div>
                  `)}
                </div>
              </div>

              <!-- Photo card -->
              <div class="bless-card bless-photo-card">
                <img src="https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600" alt="證嚴上人" />
                <div class="bless-photo-overlay"></div>
                <span class="bless-photo-text">證嚴上人</span>
              </div>
            </div>
          </div>
        </div>
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
