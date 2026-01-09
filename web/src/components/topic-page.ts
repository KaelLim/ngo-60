import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';

interface TopicActivity {
  id: number;
  title: string;
  dateStart: string;
  dateEnd: string;
  participation: string;
  image: string;
  description: string;
}

interface TopicData {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  backgroundImage: string;
  activities: TopicActivity[];
}

@customElement('topic-page')
export class TopicPage extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @property({ type: Number })
  topicId: number = 1;

  private storeController!: StoreController;

  // Hardcoded topic data for UI
  private topicsData: Record<number, TopicData> = {
    1: {
      id: 1,
      title: '合作',
      subtitle: '當行動成為力量',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。\n捶大不喀裹女連不以電。',
      backgroundImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      activities: [
        {
          id: 1,
          title: '友善蔬食旅店推動計畫',
          dateStart: '2026.08.28',
          dateEnd: '2026.09.05',
          participation: '現場參與 - 以店家費用為準',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
          description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電。'
        },
        {
          id: 2,
          title: '哈佛沈浸式展覽',
          dateStart: '2026.08.28',
          dateEnd: '2026.09.05',
          participation: '線上參與 - 免費',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電。'
        }
      ]
    },
    2: {
      id: 2,
      title: '人文',
      subtitle: '讓歷史再翻新',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。\n捶大不喀裹女連不以電。',
      backgroundImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      activities: [
        {
          id: 3,
          title: '傳統文化節',
          dateStart: '2026.09.10',
          dateEnd: '2026.09.15',
          participation: '現場參與 - 免費',
          image: 'https://images.unsplash.com/photo-1513297887119-d46091b24bfa?w=800',
          description: '重現在地傳統技藝與習俗，體驗文化的深度與廣度。'
        }
      ]
    },
    3: {
      id: 3,
      title: '祈福',
      subtitle: '讓善念被積累',
      description: '任新改統明措，記焉難張或、信頓，身奏在車種我，面。捶大不喀裹女連不以電，。的任新改統明措，記焉難張或、信頓，身奏在車種我，面。\n捶大不喀裹女連不以電。',
      backgroundImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
      activities: [
        {
          id: 4,
          title: '線上浴佛',
          dateStart: '2026.08.28',
          dateEnd: '2026.09.05',
          participation: '線上參與 - 免費',
          image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800',
          description: '透過線上平台參與浴佛儀式，淨化心靈。'
        }
      ]
    }
  };

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #0e2669;
      overflow: hidden;
    }

    .page-container {
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Background with faded images */
    .page-bg {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      overflow: hidden;
    }

    .page-bg img {
      width: 100%;
      height: 212px;
      object-fit: cover;
    }

    /* Content area */
    .page-content {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 20px 12px;
      padding-bottom: 60px;
    }

    .page-content::-webkit-scrollbar {
      display: none;
    }

    /* Back button */
    .back-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      flex-shrink: 0;
    }

    .back-button:active {
      transform: scale(0.95);
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: white;
    }

    /* Title section */
    .title-section {
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .topic-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 500;
      color: white;
      line-height: 1.2;
      margin: 0;
    }

    .topic-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 28px;
      font-weight: 400;
      color: white;
      line-height: 1.2;
      margin: 0;
    }

    .topic-description {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: white;
      line-height: 1.4;
      margin: 12px 0 0 0;
      white-space: pre-line;
    }

    /* Activity cards */
    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-card {
      position: relative;
      overflow: visible;
    }

    .activity-card-shape {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .activity-card-shape svg {
      width: 100%;
      height: 100%;
    }

    .activity-card-bg {
      position: relative;
      padding: 20px 12px;
      z-index: 1;
    }

    .activity-card-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .activity-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-right: 50px;
    }

    .activity-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #121212;
      line-height: 1.28;
      margin: 0;
    }

    .activity-items {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .activity-row {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .activity-icon {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .activity-icon svg {
      width: 100%;
      height: 100%;
    }

    .activity-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #121212;
      line-height: 16px;
    }

    .activity-image {
      width: 100%;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
    }

    .activity-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .activity-description {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #8d8d8d;
      line-height: 1.4;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Link button */
    .link-button {
      position: absolute;
      top: 0;
      right: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      z-index: 1;
    }

    .link-button:active {
      transform: scale(0.95);
    }

    .link-button svg {
      width: 24px;
      height: 24px;
      color: #0E2669;
    }

    /* Footer */
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #121212;
      padding: 8px 12px;
      text-align: center;
    }

    .footer p {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      font-weight: 400;
      color: white;
      line-height: 1.4;
      margin: 0;
    }

    /* Animation */
    :host {
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
  }

  private handleBack() {
    this.appStore.closePage();
  }

  private get currentTopic(): TopicData {
    return this.topicsData[this.topicId] || this.topicsData[1];
  }

  render() {
    const topic = this.currentTopic;

    // Back arrow SVG
    const backArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    `;

    // Calendar icon SVG
    const calendarIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M15.75 15V4.5C15.75 3.67275 15.0773 3 14.25 3H12.75V1.5H11.25V3H6.75V1.5H5.25V3H3.75C2.92275 3 2.25 3.67275 2.25 4.5V15C2.25 15.8273 2.92275 16.5 3.75 16.5H14.25C15.0773 16.5 15.75 15.8273 15.75 15ZM6.75 13.5H5.25V12H6.75V13.5ZM6.75 10.5H5.25V9H6.75V10.5ZM9.75 13.5H8.25V12H9.75V13.5ZM9.75 10.5H8.25V9H9.75V10.5ZM12.75 13.5H11.25V12H12.75V13.5ZM12.75 10.5H11.25V9H12.75V10.5ZM14.25 6.75H3.75V5.25H14.25V6.75Z" fill="#5FB7FA"/>
      </svg>
    `;

    // Person icon SVG
    const personIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C9.825 1.5 10.5 2.175 10.5 3C10.5 3.825 9.825 4.5 9 4.5C8.175 4.5 7.5 3.825 7.5 3C7.5 2.175 8.175 1.5 9 1.5ZM11.925 6.075C11.625 5.775 11.1 5.25 10.125 5.25H8.25C6.15 5.25 4.5 3.6 4.5 1.5H3C3 3.9 4.575 5.85 6.75 6.525V16.5H8.25V12H9.75V16.5H11.25V7.575L14.25 10.5L15.3 9.45L11.925 6.075Z" fill="#5FB7FA"/>
      </svg>
    `;

    // External link arrow SVG
    const linkArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 17L17 7M17 7H7M17 7V17"/>
      </svg>
    `;

    return html`
      <div class="page-container">
        <!-- Background -->
        <div class="page-bg">
          <img src="${topic.backgroundImage}" alt="" />
          <img src="${topic.backgroundImage}" alt="" />
          <img src="${topic.backgroundImage}" alt="" />
          <img src="${topic.backgroundImage}" alt="" />
        </div>

        <!-- Content -->
        <div class="page-content">
          <button class="back-button" @click=${this.handleBack}>
            ${backArrow}
          </button>

          <div class="title-section">
            <h1 class="topic-title">${topic.title}</h1>
            <p class="topic-subtitle">${topic.subtitle}</p>
            <p class="topic-description">${topic.description}</p>
          </div>

          <div class="activities-list">
            ${topic.activities.map(activity => html`
              <div class="activity-card">
                <div class="activity-card-shape">
                  <svg viewBox="0 0 351 317" fill="none" preserveAspectRatio="none">
                    <path d="M273 0C284.046 0 293 8.95431 293 20V26C293 43.6731 307.327 58 325 58H331C342.046 58 351 66.9543 351 78V297C351 308.046 342.046 317 331 317H20C8.95431 317 0 308.046 0 297V20C0 8.9543 8.95431 0 20 0H273Z" fill="white"/>
                  </svg>
                </div>
                <button class="link-button">
                  ${linkArrow}
                </button>
                <div class="activity-card-bg">
                  <div class="activity-card-content">
                    <div class="activity-info">
                      <h3 class="activity-title">${activity.title}</h3>
                      <div class="activity-items">
                        <div class="activity-row">
                          <span class="activity-icon">${calendarIcon}</span>
                          <span class="activity-text">${activity.dateStart} - ${activity.dateEnd}</span>
                        </div>
                        <div class="activity-row">
                          <span class="activity-icon">${personIcon}</span>
                          <span class="activity-text">${activity.participation}</span>
                        </div>
                      </div>
                    </div>
                    <div class="activity-image">
                      <img src="${activity.image}" alt="${activity.title}" />
                    </div>
                    <p class="activity-description">${activity.description}</p>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Copyright © 2020 Open Source Matters. 版權所有. Copyright, OOO Foundation.</p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'topic-page': TopicPage;
  }
}
