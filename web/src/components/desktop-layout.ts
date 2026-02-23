import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, Homepage, Topic, Event, ImpactSection, ImpactConfig, Blessing, BlessingTag, GalleryImage } from '../services/api.js';

import './desktop-header.js';
import './desktop-intro.js';
import './desktop-topics.js';
import './desktop-schedule.js';
import './desktop-impact.js';
import './desktop-blessings.js';

@customElement('desktop-layout')
export class DesktopLayout extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  private storeController!: StoreController<AppStore>;

  @state()
  private homepage: Homepage | null = null;

  @state()
  private galleryImages: GalleryImage[] = [];

  @state()
  private topics: Topic[] = [];

  @state()
  private events: Event[] = [];

  @state()
  private activeMonths: number[] = [];

  @state()
  private impactSections: ImpactSection[] = [];

  @state()
  private impactConfig: ImpactConfig | null = null;

  @state()
  private blessings: Blessing[] = [];

  @state()
  private blessingTags: BlessingTag[] = [];

  @state()
  private loading = true;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      background: #0e2669;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .desktop-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #e4ddd4;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
    }

    /* Section cards */
    .section-card {
      background: #e4ddd4;
      border-radius: 60px;
      overflow: hidden;
    }

    /* Copyright footer */
    .copyright {
      background: #121212;
      padding: 16px 40px;
      text-align: center;
    }

    .copyright-text {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 14px;
      color: white;
      margin: 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.loadData();
  }

  private async loadData() {
    try {
      const [homepage, images, topics, events, activeMonths, impact, impactConfig, blessings, blessingTags] = await Promise.all([
        api.getHomepage(),
        api.getGalleryRandom(25, 'homepage'),
        api.getTopics(),
        api.getEvents({ month: this.appStore.selectedMonth, year: this.appStore.selectedYear }),
        api.getActiveMonths(this.appStore.selectedYear),
        api.getImpactSections(),
        api.getImpactConfig(),
        api.getBlessings(),
        api.getBlessingTags()
      ]);

      this.homepage = homepage;
      this.galleryImages = images;
      this.topics = topics;
      this.events = events;
      this.activeMonths = activeMonths;
      this.impactSections = impact;
      this.impactConfig = impactConfig;
      this.blessings = blessings;
      this.blessingTags = blessingTags;
    } catch (e) {
      console.error('Failed to load desktop data:', e);
    } finally {
      this.loading = false;
    }
  }

  private handleMonthChange(e: CustomEvent<{ month: number; year: number }>) {
    const { month, year } = e.detail;
    this.appStore.setSelectedMonth(month);
    this.appStore.setSelectedYear(year);
    this.loadEvents();
  }

  private async loadEvents() {
    try {
      this.events = await api.getEvents({
        month: this.appStore.selectedMonth,
        year: this.appStore.selectedYear
      });
    } catch (e) {
      console.error('Failed to load events:', e);
    }
  }

  private handleTopicClick(e: CustomEvent<number>) {
    const topicId = e.detail;
    this.appStore.openCategory(topicId);
  }

  private handleBlessingClick(e: CustomEvent<number>) {
    const blessingId = e.detail;
    this.appStore.openBlessing(blessingId);
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">載入中...</div>`;
    }

    return html`
      <div class="desktop-container">
        <!-- Header: 百工圖 + Slogan -->
        <desktop-header
          .images=${this.galleryImages}
          .slogan=${this.homepage?.slogan || 'NGO 60\nSLOGAN'}
        ></desktop-header>

        <!-- Intro: 介紹區 -->
        <div class="section-card">
          <desktop-intro
            .title=${this.homepage?.title || ''}
            .content=${this.homepage?.content || ''}
          ></desktop-intro>
        </div>

        <!-- Topics: 看主題 -->
        <div class="section-card">
          <desktop-topics
            .topics=${this.topics}
            @topic-click=${this.handleTopicClick}
          ></desktop-topics>
        </div>

        <!-- Schedule: 看時程 -->
        <div class="section-card">
          <desktop-schedule
            .events=${this.events}
            .selectedMonth=${this.appStore.selectedMonth}
            .selectedYear=${this.appStore.selectedYear}
            .activeMonths=${this.activeMonths}
            @month-change=${this.handleMonthChange}
          ></desktop-schedule>
        </div>

        <!-- Impact: 看影響 + 祝福區 -->
        <div class="section-card">
          <desktop-impact
            .sections=${this.impactSections}
            .config=${this.impactConfig}
            .blessingTags=${this.blessingTags}
          ></desktop-impact>
        </div>

        <!-- 內部期許: 祝福卡片輪播 -->
        <div class="section-card">
          <desktop-blessings
            .blessings=${this.blessings}
            @blessing-click=${this.handleBlessingClick}
          ></desktop-blessings>
        </div>
      </div>

      <!-- Copyright -->
      <div class="copyright">
        <p class="copyright-text">
          Copyright © 2020 Open Source Matters. 版權所有.<br>
          Copyright, Tzuchi Foundation.
        </p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-layout': DesktopLayout;
  }
}
