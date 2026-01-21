import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Topic, Event, api } from '../services/api.js';

@customElement('desktop-topics')
export class DesktopTopics extends LitElement {
  @property({ type: Array })
  topics: Topic[] = [];

  @state()
  private selectedTopicIndex = 0;

  @state()
  private topicEvents: Event[] = [];

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

    .content-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }

    /* Left: Topic cards list - each card is independent */
    .topic-cards-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Individual topic card */
    .topic-card {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .topic-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .topic-card:active {
      transform: translateY(-2px) scale(0.98);
    }

    /* Active card - expanded with full content */
    .topic-card.active {
      min-height: 200px;
    }

    .topic-card.active .topic-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
    }

    .topic-card.active .topic-card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(14, 38, 105, 0.9);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .topic-card.active .topic-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: white;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }

    .topic-card.active .topic-card-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Inactive card - simple row style */
    .topic-card.inactive {
      background: white;
      padding: 20px 24px;
    }

    .topic-card.inactive .topic-card-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #0e2669;
      margin: 0;
    }

    /* Right: Activity cards - horizontal layout */
    .events-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .events-list {
      display: flex;
      flex-direction: row;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .events-list::-webkit-scrollbar {
      display: none;
    }

    /* Activity card - fixed width 328px */
    .activity-card {
      position: relative;
      overflow: visible;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      width: 328px;
      flex-shrink: 0;
    }

    .activity-card:hover {
      transform: translateY(-4px);
    }

    .activity-card:active {
      transform: scale(0.98);
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
      z-index: 2;
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

    .empty-message {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: #999;
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 20px;
    }
  `;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('topics') && this.topics.length > 0) {
      this.loadTopicEvents(this.topics[0].id);
    }
  }

  private async loadTopicEvents(topicId: number) {
    try {
      const topic = await api.getTopicById(topicId);
      if (topic) {
        this.topicEvents = topic.events || [];
      }
    } catch (e) {
      console.error('Failed to load topic events:', e);
    }
  }

  private handleTopicSelect(index: number) {
    this.selectedTopicIndex = index;
    if (this.topics[index]) {
      this.loadTopicEvents(this.topics[index].id);
    }
  }

  private handleTopicClick(topicId: number) {
    this.dispatchEvent(new CustomEvent('topic-click', {
      detail: topicId,
      bubbles: true,
      composed: true
    }));
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}.${date.getDate().toString().padStart(2, '0')}`;
  }

  private getParticipationText(event: Event): string {
    return event.participation_type || '現場參與';
  }

  render() {
    const calendarIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M15.75 15V4.5C15.75 3.67275 15.0773 3 14.25 3H12.75V1.5H11.25V3H6.75V1.5H5.25V3H3.75C2.92275 3 2.25 3.67275 2.25 4.5V15C2.25 15.8273 2.92275 16.5 3.75 16.5H14.25C15.0773 16.5 15.75 15.8273 15.75 15ZM6.75 13.5H5.25V12H6.75V13.5ZM6.75 10.5H5.25V9H6.75V10.5ZM9.75 13.5H8.25V12H9.75V13.5ZM9.75 10.5H8.25V9H9.75V10.5ZM12.75 13.5H11.25V12H12.75V13.5ZM12.75 10.5H11.25V9H12.75V10.5ZM14.25 6.75H3.75V5.25H14.25V6.75Z" fill="#5FB7FA"/>
      </svg>
    `;

    const personIcon = html`
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C9.825 1.5 10.5 2.175 10.5 3C10.5 3.825 9.825 4.5 9 4.5C8.175 4.5 7.5 3.825 7.5 3C7.5 2.175 8.175 1.5 9 1.5ZM11.925 6.075C11.625 5.775 11.1 5.25 10.125 5.25H8.25C6.15 5.25 4.5 3.6 4.5 1.5H3C3 3.9 4.575 5.85 6.75 6.525V16.5H8.25V12H9.75V16.5H11.25V7.575L14.25 10.5L15.3 9.45L11.925 6.075Z" fill="#5FB7FA"/>
      </svg>
    `;

    const linkArrow = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14M14 5l7 7-7 7"/>
      </svg>
    `;

    return html`
      <div class="section-container">
        <div class="section-title">看主題</div>

        <div class="content-grid">
          <!-- Left: Topic cards (each independent) -->
          <div class="topic-cards-list">
            ${this.topics.map((topic, index) => {
              const isActive = index === this.selectedTopicIndex;
              return isActive ? html`
                <!-- Active card - expanded with background -->
                <div
                  class="topic-card active"
                  @click=${() => this.handleTopicClick(topic.id)}
                >
                  <div
                    class="topic-card-bg"
                    style="background-image: url('${topic.background_image || ''}')"
                  ></div>
                  <div class="topic-card-overlay">
                    <h3 class="topic-card-title">${topic.name} ${topic.subtitle || ''}</h3>
                    <p class="topic-card-desc">${topic.description || ''}</p>
                  </div>
                </div>
              ` : html`
                <!-- Inactive card - simple row -->
                <div
                  class="topic-card inactive"
                  @click=${() => this.handleTopicSelect(index)}
                >
                  <p class="topic-card-text">${topic.name} ${topic.subtitle || ''}</p>
                </div>
              `;
            })}
          </div>

          <!-- Right: Activity cards (horizontal scroll) -->
          <div class="events-section">
            ${this.topicEvents.length > 0 ? html`
              <div class="events-list">
                ${this.topicEvents.map(event => html`
                  <div class="activity-card">
                    <div class="activity-card-shape">
                      <svg viewBox="0 0 351 317" fill="none" preserveAspectRatio="none">
                        <path d="M273 0C284.046 0 293 8.95431 293 20V26C293 43.6731 307.327 58 325 58H331C342.046 58 351 66.9543 351 78V297C351 308.046 342.046 317 331 317H20C8.95431 317 0 308.046 0 297V20C0 8.9543 8.95431 0 20 0H273Z" fill="white"/>
                      </svg>
                    </div>
                    <button class="link-button" @click=${() => event.link_url && window.open(event.link_url, '_blank')}>
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
                              <span class="activity-text">${this.getParticipationText(event)}</span>
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
            ` : html`
              <div class="empty-message">暫無活動</div>
            `}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-topics': DesktopTopics;
  }
}
