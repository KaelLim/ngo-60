import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, TopicWithEvents, Event } from '../services/api.js';

@customElement('topic-page')
export class TopicPage extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @property({ type: Number })
  topicId: number = 1;

  @property({ type: Boolean, reflect: true })
  desktopMode = false;

  @state()
  private topicData: TopicWithEvents | null = null;

  @state()
  private loading = false;

  @property({ type: Boolean, reflect: true })
  closing = false;

  private storeController!: StoreController<AppStore>;

  static styles = css`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: #0e2669;
      overflow: hidden;
    }

    /* Mobile: 限制寬度並置中 */
    @media (max-width: 767px) {
      :host {
        max-width: 430px;
        margin: 0 auto;
      }
    }

    /* Desktop mode - embedded instead of fixed overlay */
    :host([desktopMode]) {
      position: relative;
      inset: auto;
      z-index: auto;
      height: 100%;
    }

    .page-container {
      height: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    /* Background with faded image */
    .page-bg {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-size: 100% auto;
      background-repeat: repeat-y;
      background-position: top center;
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
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        background-color 0.2s ease,
        box-shadow 0.2s ease;
      flex-shrink: 0;
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: scale(1.05);
    }

    .back-button:active {
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.25);
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: white;
      transition: transform 0.2s ease;
    }

    .back-button:hover svg {
      transform: translateX(-2px);
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
      right: 2%;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease,
        background-color 0.2s ease;
      z-index: 1;
    }

    .link-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      background: #f8f8f8;
    }

    .link-button:active {
      transform: scale(0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .link-button svg {
      width: 24px;
      height: 24px;
      color: #0E2669;
      transition: transform 0.2s ease;
    }

    .link-button:hover svg {
      transform: translate(2px, -2px);
    }

    /* Animation - Mobile slide in (on container to preserve centering) */
    @media (max-width: 767px) {
      .page-container {
        animation: slideInPage 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      :host([closing]) .page-container {
        animation: slideOutPage 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
    }

    @keyframes slideInPage {
      from {
        transform: translateX(100%);
        opacity: 0.5;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOutPage {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    /* Animation - Desktop fade in */
    :host([desktopMode]) {
      animation: fadeInPage 0.35s ease-out forwards;
    }

    @keyframes fadeInPage {
      from {
        opacity: 0;
        transform: scale(0.98);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Animation - Desktop fade out (exit) */
    :host([desktopMode][closing]) {
      animation: fadeOutPage 0.3s ease-in forwards;
    }

    @keyframes fadeOutPage {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.96);
      }
    }

    /* Animation - Title section */
    .title-section {
      animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
    }

    @keyframes slideUpFade {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Animation - Activity cards stagger */
    .activity-card {
      animation: cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .activity-card:nth-child(1) { animation-delay: 0.15s; }
    .activity-card:nth-child(2) { animation-delay: 0.2s; }
    .activity-card:nth-child(3) { animation-delay: 0.25s; }
    .activity-card:nth-child(4) { animation-delay: 0.3s; }
    .activity-card:nth-child(5) { animation-delay: 0.35s; }
    .activity-card:nth-child(6) { animation-delay: 0.4s; }

    @keyframes cardEnter {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Animation - Back button */
    .back-button {
      animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Desktop mode - grid card layout */
    :host([desktopMode]) .activities-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      max-width: 100%;
    }

    :host([desktopMode]) .activity-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1 / 1;
      display: flex;
      flex-direction: column;
    }

    :host([desktopMode]) .activity-card-shape {
      display: none;
    }

    :host([desktopMode]) .activity-card-bg {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :host([desktopMode]) .activity-card-content {
      flex-direction: column;
      gap: 0;
      height: 100%;
    }

    :host([desktopMode]) .activity-image {
      width: 100%;
      flex: 1;
      min-height: 0;
      border-radius: 0;
      order: -1;
    }

    :host([desktopMode]) .activity-info {
      padding: 0.75rem;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    :host([desktopMode]) .activity-title {
      font-size: 1.2rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    :host([desktopMode]) .activity-items {
      gap: 0.3rem;
    }

    :host([desktopMode]) .activity-row {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    :host([desktopMode]) .activity-icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host([desktopMode]) .activity-icon svg {
      width: 100%;
      height: 100%;
    }

    :host([desktopMode]) .activity-text {
      font-size: 1rem;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host([desktopMode]) .activity-description {
      display: none;
    }

    :host([desktopMode]) .link-button {
      top: 6px;
      right: 6px;
      width: 28px;
      height: 28px;
      background: rgba(14, 38, 105, 0.9);
      transform: none;
    }

    :host([desktopMode]) .link-button:active {
      transform: scale(0.95);
    }

    :host([desktopMode]) .link-button svg {
      width: 14px;
      height: 14px;
      color: white;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.loadTopicData();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('topicId')) {
      this.loadTopicData();
    }
  }

  private async loadTopicData() {
    if (!this.topicId) return;

    this.loading = true;
    try {
      const data = await api.getTopicById(this.topicId);
      this.topicData = data;
    } catch (error) {
      console.error('Failed to load topic:', error);
      this.topicData = null;
    } finally {
      this.loading = false;
    }
  }

  private handleBack() {
    // Trigger exit animation
    this.closing = true;

    // Wait for animation to complete, then close
    const duration = this.desktopMode ? 300 : 350;
    setTimeout(() => {
      this.appStore.closePage();
    }, duration);
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatParticipation(event: Event): string {
    return event.participation_type || '';
  }

  private handleEventClick(event: Event) {
    if (event.link_url) {
      window.open(event.link_url, '_blank');
    }
  }

  render() {
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

    // Loading state
    if (this.loading) {
      return html`
        <div class="page-container">
          <div class="page-content" style="display: flex; align-items: center; justify-content: center;">
            <p style="color: white;">載入中...</p>
          </div>
        </div>
      `;
    }

    // No data state
    if (!this.topicData) {
      return html`
        <div class="page-container">
          <div class="page-content">
            <button class="back-button" @click=${this.handleBack}>
              ${backArrow}
            </button>
            <p style="color: white; text-align: center; margin-top: 40px;">找不到主題資料</p>
          </div>
        </div>
      `;
    }

    const topic = this.topicData;
    const backgroundImage = topic.background_image || '';

    return html`
      <div class="page-container">
        <!-- Background -->
        <div class="page-bg" style="background-image: url('${backgroundImage}')"></div>

        <!-- Content -->
        <div class="page-content">
          <button class="back-button" @click=${this.handleBack}>
            ${backArrow}
          </button>

          <div class="title-section">
            <h1 class="topic-title">${topic.name}</h1>
            <p class="topic-subtitle">${topic.subtitle || ''}</p>
            <p class="topic-description">${topic.description || ''}</p>
          </div>

          <div class="activities-list">
            ${topic.events.map(event => html`
              <div class="activity-card">
                <div class="activity-card-shape">
                  <svg viewBox="0 0 351 317" fill="none" preserveAspectRatio="none">
                    <path d="M273 0C284.046 0 293 8.95431 293 20V26C293 43.6731 307.327 58 325 58H331C342.046 58 351 66.9543 351 78V297C351 308.046 342.046 317 331 317H20C8.95431 317 0 308.046 0 297V20C0 8.9543 8.95431 0 20 0H273Z" fill="white"/>
                  </svg>
                </div>
                <button class="link-button" @click=${() => this.handleEventClick(event)}>
                  ${linkArrow}
                </button>
                <div class="activity-card-bg">
                  <div class="activity-card-content">
                    <div class="activity-info">
                      <h3 class="activity-title">${event.title}</h3>
                      <div class="activity-items">
                        <div class="activity-row">
                          <span class="activity-icon">${calendarIcon}</span>
                          <span class="activity-text">${this.formatDate(event.date_start)}${event.date_end ? ` - ${this.formatDate(event.date_end)}` : ''}</span>
                        </div>
                        <div class="activity-row">
                          <span class="activity-icon">${personIcon}</span>
                          <span class="activity-text">${this.formatParticipation(event)}</span>
                        </div>
                      </div>
                    </div>
                    ${event.image_url ? html`
                      <div class="activity-image">
                        <img src="${event.image_url}" alt="${event.title}" />
                      </div>
                    ` : ''}
                    ${event.description ? html`
                      <p class="activity-description">${event.description}</p>
                    ` : ''}
                  </div>
                </div>
              </div>
            `)}
          </div>
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
