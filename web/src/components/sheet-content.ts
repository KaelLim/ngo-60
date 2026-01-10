import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, Topic, Event, ImpactSection, Blessing } from '../services/api.js';

import './homepage-tabs.js';

type TopicStyle = 'v1' | 'v2';

@customElement('sheet-content')
export class SheetContent extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @property({ type: Boolean, reflect: true })
  desktopMode = false;

  @state()
  private topicStyle: TopicStyle = 'v2';

  @state()
  private blessHighlightIndex: number = 2;

  // API Data
  @state()
  private topics: Topic[] = [];

  @state()
  private events: Event[] = [];

  @state()
  private impactSections: ImpactSection[] = [];

  @state()
  private blessings: Blessing[] = [];

  @state()
  private loading = false;

  private storeController!: StoreController<AppStore>;
  private blessIntervalId: number | null = null;

  static styles = css`
    :host {
      display: block;
      padding: 0 12px;
      position: relative;
    }

    /* Desktop mode styles */
    :host([desktopMode]) {
      padding: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    :host([desktopMode]) .desktop-header {
      padding: 20px;
      background: white;
      border-bottom: 1px solid #eee;
    }

    :host([desktopMode]) .desktop-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    /* Content switch animation */
    .content-section {
      animation: contentFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes contentFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Card stagger animation */
    .topic-card, .impact-card, .schedule-card, .bless-card {
      animation: cardSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .topic-card:nth-child(1), .impact-card:nth-child(1) { animation-delay: 0.05s; }
    .topic-card:nth-child(2), .impact-card:nth-child(2) { animation-delay: 0.1s; }
    .topic-card:nth-child(3), .impact-card:nth-child(3) { animation-delay: 0.15s; }
    .topic-card:nth-child(4), .impact-card:nth-child(4) { animation-delay: 0.2s; }
    .topic-card:nth-child(5), .impact-card:nth-child(5) { animation-delay: 0.25s; }
    .topic-card:nth-child(6), .impact-card:nth-child(6) { animation-delay: 0.3s; }

    @keyframes cardSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* ========== Interactive Hover/Active Animations ========== */

    /* Topic card hover */
    .topic-card {
      transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease;
    }

    .topic-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .topic-card:active {
      transform: translateY(-2px) scale(0.98);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    /* Impact card hover */
    .impact-card {
      transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease;
    }

    .impact-card:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .impact-card:active {
      transform: translateY(-2px) scale(0.98);
    }

    /* Bless card hover */
    .bless-card {
      transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease;
    }

    .bless-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .bless-card:active {
      transform: translateY(-1px) scale(0.98);
    }

    /* Month card hover */
    .month-card {
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .month-card:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .month-card:active {
      transform: scale(0.95);
    }

    /* Event card hover */
    .event-card {
      transition:
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.25s ease;
    }

    .event-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .event-card:active {
      transform: translateY(-1px) scale(0.98);
    }

    /* Style toggle button */
    .style-toggle {
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
    }

    .style-toggle:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .style-toggle:active {
      transform: scale(0.92);
    }

    /* Button hover effects */
    .impact-report-btn,
    .impact-link-btn {
      transition:
        transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        background-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .impact-report-btn:hover,
    .impact-link-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .impact-report-btn:active,
    .impact-link-btn:active {
      transform: scale(0.95);
    }

    .desktop-header {
      display: none;
    }

    :host([desktopMode]) .desktop-header {
      display: block;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
      font-family: 'Noto Sans TC', sans-serif;
    }

    /* Style toggle button - hide in desktop */
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

    :host([desktopMode]) .style-toggle {
      display: none;
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

    .impact-report-card {
      background: #0e2669;
      border-radius: 20px;
      height: 351px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .impact-graphic {
      position: relative;
      width: 303px;
      height: 220px;
      margin-top: 32px;
    }

    .impact-triangle {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 48px;
      width: 160px;
      height: 125px;
    }

    .impact-triangle svg {
      width: 100%;
      height: 100%;
    }

    .impact-node {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .impact-node.top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 138px;
    }

    .impact-node.bottom-left {
      top: 149px;
      left: 0;
      width: 120px;
    }

    .impact-node.bottom-right {
      top: 149px;
      right: 0;
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

    .impact-buttons {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
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
      transition: background-color 0.5s ease;
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
      transition: color 0.5s ease;
    }

    .bless-dialog-bubble.highlight span {
      color: white;
    }

    .bless-dialog-pointer svg path {
      transition: fill 0.5s ease;
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

  // Hardcoded bless messages for dialog bubbles
  private blessMessages = [
    '謝謝陪伴需要幫助的人',
    '陪災民找回希望',
    '願醫護人員健康平安',
    '讓善心善款都能化為溫暖',
    '持續守護台灣與世界'
  ];

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);

    // Start bless highlight rotation every 5 seconds
    this.blessIntervalId = window.setInterval(() => {
      this.blessHighlightIndex = (this.blessHighlightIndex + 1) % this.blessMessages.length;
    }, 5000);

    // Load initial data
    this.loadData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.blessIntervalId !== null) {
      window.clearInterval(this.blessIntervalId);
      this.blessIntervalId = null;
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      // Load all data in parallel
      const [topics, events, impactSections, blessings] = await Promise.all([
        api.getTopics(),
        api.getEvents({ month: this.appStore.selectedMonth, year: this.appStore.selectedYear }),
        api.getImpactSections(),
        api.getBlessings(true) // Get featured blessings
      ]);

      this.topics = topics;
      this.events = events;
      this.impactSections = impactSections;
      this.blessings = blessings;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async loadEvents() {
    try {
      this.events = await api.getEvents({
        month: this.appStore.selectedMonth,
        year: this.appStore.selectedYear
      });
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }

  private handleTopicClick(topicId: number) {
    this.appStore.openCategory(topicId, 'topics');
  }

  private handleMonthClick(month: number) {
    this.appStore.setSelectedMonth(month);
    this.loadEvents();
  }

  private handleBlessingClick(blessingId: number) {
    this.appStore.openBlessing(blessingId);
  }

  private toggleTopicStyle() {
    this.topicStyle = this.topicStyle === 'v1' ? 'v2' : 'v1';
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  private getParticipationText(event: Event): string {
    const type = event.participation_type === 'online' ? '線上參與' : '現場參與';
    const fee = event.participation_fee || '免費';
    return `${type} - ${fee}`;
  }

  private renderTopics() {
    if (this.loading) {
      return html`<div class="loading">載入中...</div>`;
    }

    // Fallback images for topics without images
    const defaultImages = [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'
    ];

    return html`
      <div class="topic-list ${this.topicStyle}">
        ${this.topics.map((topic, index) => html`
          <div
            class="topic-card"
            @click=${() => this.handleTopicClick(topic.id)}
          >
            <div
              class="topic-card-bg"
              style="background-image: url('${topic.background_image || defaultImages[index % defaultImages.length]}')"
            ></div>
            <div class="topic-card-overlay">
              <div class="topic-card-header">
                <div class="topic-card-titles">
                  <p class="topic-card-title">${topic.name}</p>
                  <p class="topic-card-subtitle">${topic.subtitle || ''}</p>
                </div>
                <div class="topic-card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <p class="topic-card-desc">${topic.description || ''}</p>
            </div>
          </div>
        `)}
      </div>
      <button class="style-toggle" @click=${this.toggleTopicStyle}>
        風格: ${this.topicStyle === 'v1' ? '全覆蓋' : '分割式'}
      </button>
    `;
  }

  private renderSchedule() {
    const selectedMonth = this.appStore.selectedMonth;
    const selectedYear = this.appStore.selectedYear;

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

    // Fallback image
    const defaultEventImage = 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400';

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
          ${this.loading ? html`<div class="loading">載入中...</div>` :
            this.events.length > 0 ? this.events.map(event => html`
              <div class="event-card">
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
                <div class="event-image">
                  <img src="${event.image_url || defaultEventImage}" alt="${event.title}" />
                </div>
              </div>
            `) : html`
              <div class="empty-state">此月份暫無活動</div>
            `
          }
        </div>
      </div>
    `;
  }

  private renderImpact() {
    const triangleSvg = html`
      <svg viewBox="0 0 160 125" fill="none">
        <path d="M80 5 L155 120 L5 120 Z" stroke="#5fb7fa" stroke-width="2" fill="none"/>
      </svg>
    `;

    const arrowIcon = html`
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#121212" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const pointerSvg = (highlight: boolean) => html`
      <svg viewBox="0 0 12 16" fill="none">
        <path d="M12 8L0 0V16L12 8Z" fill="${highlight ? '#0e2669' : '#e4ddd4'}"/>
      </svg>
    `;

    // Get first featured blessing for photo card
    const featuredBlessing = this.blessings[0];
    const defaultBlessingImage = 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600';

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
                    <span>${this.impactSections[0]?.name || '永續'}環境</span>
                  </div>
                </div>
              </div>

              <!-- Bottom left node: 深耕共伴 -->
              <div class="impact-node bottom-left">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${this.impactSections[1]?.name || '深耕'}共伴</span>
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
                    <span>${this.impactSections[2]?.name || '向光'}家園</span>
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
                  ${this.blessMessages.map((msg, index) => html`
                    <div class="bless-dialog">
                      <div class="bless-dialog-bubble ${index === this.blessHighlightIndex ? 'highlight' : ''}">
                        <span>${msg}</span>
                      </div>
                      <div class="bless-dialog-pointer">
                        ${pointerSvg(index === this.blessHighlightIndex)}
                      </div>
                    </div>
                  `)}
                </div>
              </div>

              <!-- Photo cards from API -->
              ${this.blessings.map(blessing => html`
                <div class="bless-card bless-photo-card" @click=${() => this.handleBlessingClick(blessing.id)}>
                  <img src="${blessing.image_url || defaultBlessingImage}" alt="${blessing.author}" />
                  <div class="bless-photo-overlay"></div>
                  <span class="bless-photo-text">${blessing.author}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderContent() {
    const activeTab = this.appStore.activeTab;

    let content;
    switch (activeTab) {
      case 'topics':
        content = this.renderTopics();
        break;
      case 'schedule':
        content = this.renderSchedule();
        break;
      case 'impact':
        content = this.renderImpact();
        break;
      default:
        content = this.renderTopics();
    }

    // Wrap content with animation class, use activeTab as key for re-animation
    return html`<div class="content-section" key=${activeTab}>${content}</div>`;
  }

  render() {
    if (this.desktopMode) {
      return html`
        <div class="desktop-header">
          <homepage-tabs
            .activeTab=${this.appStore.activeTab}
            @tab-change=${this.handleTabChange}
          ></homepage-tabs>
        </div>
        <div class="desktop-content">
          ${this.renderContent()}
        </div>
      `;
    }

    return this.renderContent();
  }

  private handleTabChange(e: CustomEvent) {
    this.appStore.setActiveTab(e.detail);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sheet-content': SheetContent;
  }
}
