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

  @state()
  private eventCarouselIndex = 0;

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

    /* Right: Event cards - using mobile style */
    .events-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .events-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Mobile-style event card */
    .event-card {
      background: white;
      border-radius: 20px;
      padding: 20px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .event-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .event-card:active {
      transform: scale(0.98);
    }

    .event-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }

    .event-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #121212;
      line-height: 1.3;
      margin: 0;
    }

    .event-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .event-row {
      display: flex;
      align-items: center;
      gap: 8px;
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
      font-size: 14px;
      color: #666;
      line-height: 1.3;
    }

    .event-image {
      width: 120px;
      height: 120px;
      border-radius: 12px;
      background: #f5f5f5;
      flex-shrink: 0;
      overflow: hidden;
      margin-left: 16px;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Navigation arrows */
    .nav-arrows {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    .nav-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, border-color 0.2s;
    }

    .nav-button:hover {
      background: #f5f5f5;
      border-color: #ccc;
    }

    .nav-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .nav-button svg {
      width: 20px;
      height: 20px;
      color: #333;
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
    this.eventCarouselIndex = 0;
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

  private handlePrevEvents() {
    if (this.eventCarouselIndex > 0) {
      this.eventCarouselIndex--;
    }
  }

  private handleNextEvents() {
    const maxIndex = Math.max(0, this.topicEvents.length - 2);
    if (this.eventCarouselIndex < maxIndex) {
      this.eventCarouselIndex++;
    }
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}.${date.getDate().toString().padStart(2, '0')}`;
  }

  private getParticipationText(event: Event): string {
    return event.participation_type || '現場參與';
  }

  render() {
    const visibleEvents = this.topicEvents.slice(this.eventCarouselIndex, this.eventCarouselIndex + 2);
    const canPrev = this.eventCarouselIndex > 0;
    const canNext = this.eventCarouselIndex < this.topicEvents.length - 2;

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

          <!-- Right: Event cards (mobile style) -->
          <div class="events-section">
            ${this.topicEvents.length > 0 ? html`
              <div class="events-list">
                ${visibleEvents.map(event => html`
                  <div class="event-card" @click=${() => event.link_url && window.open(event.link_url, '_blank')}>
                    <div class="event-info">
                      <p class="event-title">${event.title}</p>
                      <div class="event-items">
                        <div class="event-row">
                          <span class="event-icon">${calendarIcon}</span>
                          <span class="event-text">
                            ${this.formatDate(event.date_start)}${event.date_end ? ` - ${this.formatDate(event.date_end)}` : ''}
                          </span>
                        </div>
                        <div class="event-row">
                          <span class="event-icon">${personIcon}</span>
                          <span class="event-text">${this.getParticipationText(event)}</span>
                        </div>
                      </div>
                    </div>
                    ${event.image_url ? html`
                      <div class="event-image">
                        <img src=${event.image_url} alt=${event.title} />
                      </div>
                    ` : ''}
                  </div>
                `)}
              </div>

              <div class="nav-arrows">
                <button class="nav-button" ?disabled=${!canPrev} @click=${this.handlePrevEvents}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button class="nav-button" ?disabled=${!canNext} @click=${this.handleNextEvents}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
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
