import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Topic, Event, api, TopicWithEvents } from '../services/api.js';

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
      grid-template-columns: 280px 1fr;
      gap: 24px;
    }

    /* Left: Topic list card */
    .topic-list-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    /* Main topic card with background image */
    .main-topic {
      position: relative;
      min-height: 180px;
      cursor: pointer;
      overflow: hidden;
    }

    .main-topic-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transition: transform 0.3s ease;
    }

    .main-topic:hover .main-topic-bg {
      transform: scale(1.05);
    }

    .main-topic-overlay {
      position: absolute;
      inset: 0;
      background: rgba(14, 38, 105, 0.9);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .main-topic-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: white;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }

    .main-topic-desc {
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

    /* Topic list items */
    .topic-items {
      display: flex;
      flex-direction: column;
    }

    .topic-item {
      padding: 20px 24px;
      cursor: pointer;
      transition: background 0.2s;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .topic-item:hover {
      background: rgba(14, 38, 105, 0.05);
    }

    .topic-item.active {
      background: rgba(14, 38, 105, 0.08);
    }

    .topic-item-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 500;
      color: #0e2669;
      margin: 0;
    }

    /* Right: Event cards */
    .events-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .events-carousel {
      display: flex;
      gap: 16px;
      overflow: hidden;
    }

    .event-card {
      flex: 0 0 calc(50% - 8px);
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
      height: 140px;
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
    }

    .event-card-tag {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      color: #0e2669;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Navigation arrows */
    .nav-arrows {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
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

  private formatDateRange(start: string, end: string | null): string {
    const startDate = new Date(start);
    const startStr = `${startDate.getMonth() + 1}.${startDate.getDate()}`;

    if (!end) return startStr;

    const endDate = new Date(end);
    const endStr = `${endDate.getMonth() + 1}.${endDate.getDate()}`;

    return `${startStr} - ${endStr}`;
  }

  render() {
    const selectedTopic = this.topics[this.selectedTopicIndex];
    const visibleEvents = this.topicEvents.slice(this.eventCarouselIndex, this.eventCarouselIndex + 2);
    const canPrev = this.eventCarouselIndex > 0;
    const canNext = this.eventCarouselIndex < this.topicEvents.length - 2;

    return html`
      <div class="section-container">
        <div class="section-title">看主題</div>

        <div class="content-grid">
          <!-- Left: Topic list -->
          <div class="topic-list-card">
            ${selectedTopic ? html`
              <div class="main-topic" @click=${() => this.handleTopicClick(selectedTopic.id)}>
                <div
                  class="main-topic-bg"
                  style="background-image: url('${selectedTopic.background_image || ''}')"
                ></div>
                <div class="main-topic-overlay">
                  <h3 class="main-topic-title">${selectedTopic.name} ${selectedTopic.subtitle || ''}</h3>
                  <p class="main-topic-desc">${selectedTopic.description || ''}</p>
                </div>
              </div>
            ` : ''}

            <div class="topic-items">
              ${this.topics.filter((_, index) => index !== this.selectedTopicIndex).map((topic, index) => html`
                <div
                  class="topic-item"
                  @click=${() => this.handleTopicSelect(this.topics.indexOf(topic))}
                >
                  <p class="topic-item-text">${topic.name} ${topic.subtitle || ''}</p>
                </div>
              `)}
            </div>
          </div>

          <!-- Right: Event cards -->
          <div class="events-section">
            ${this.topicEvents.length > 0 ? html`
              <div class="events-carousel">
                ${visibleEvents.map(event => html`
                  <div class="event-card">
                    ${event.image_url ? html`
                      <img class="event-card-image" src=${event.image_url} alt=${event.title} />
                    ` : html`
                      <div class="event-card-image"></div>
                    `}
                    <div class="event-card-content">
                      <h4 class="event-card-title">${event.title}</h4>
                      <p class="event-card-date">${this.formatDateRange(event.date_start, event.date_end)}</p>
                      <div class="event-card-tag">
                        ${event.participation_type || ''}
                      </div>
                    </div>
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
