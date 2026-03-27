import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { api, ImpactSection, ImpactConfig, BlessingTag, PlaylistVideo } from '../services/api.js';

@customElement('desktop-impact')
export class DesktopImpact extends LitElement {
  @property({ type: Array })
  sections: ImpactSection[] = [];

  @property({ type: Object })
  config: ImpactConfig | null = null;

  @property({ type: Array })
  blessingTags: BlessingTag[] = [];

  @state()
  private blessInput = '';

  @state()
  private blessSubmitted = false;

  @state()
  private blessSubmitting = false;

  @state()
  private videos: PlaylistVideo[] = [];

  @state()
  private activeVideoIndex = 0;

  @state()
  private playingVideo = false;

  @state()
  private isAllShorts = false;

  private countAnimated = false;
  private observer: IntersectionObserver | null = null;
  private videosLoaded = false;

  static styles = css`
    :host {
      display: block;
    }

    .section-container {
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    /* Report section - horizontal layout */
    .report-section {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    /* Left: Title */
    .title-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 20px;
    }

    .section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: white;
      background: #121212;
      padding: 8px 24px;
      border-radius: 80px;
      display: inline-block;
      width: fit-content;
      text-align: center;
    }

    .text-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .main-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 32px;
      font-weight: 500;
      color: black;
      margin: 0;
      line-height: 1.25;
    }

    .main-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 400;
      color: black;
      margin: 0;
      line-height: 1.25;
    }

    /* Right: Graphic card */
    .graphic-card {
      width: 502px;
      flex-shrink: 0;
      background: #0e2669;
      border-radius: 20px;
      padding: 48px 54px;
      display: flex;
      flex-direction: column;
      gap: 40px;
      align-items: center;
      overflow: hidden;
      box-sizing: border-box;
    }

    .graphic-area {
      position: relative;
      width: 394px;
      height: 254px;
    }

    /* Triangle */
    .triangle-svg {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, calc(-50% + 27px));
      width: 200px;
      height: 148px;
    }

    .triangle-svg svg {
      width: 100%;
      height: 100%;
    }

    /* Nodes */
    .impact-node {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .impact-node.top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }

    .impact-node.bottom-left {
      bottom: 0;
      left: 0;
    }

    .impact-node.bottom-right {
      bottom: 0;
      right: 0;
    }

    .impact-node-badge {
      background: #0e2669;
      padding: 8px;
      border-radius: 30px;
      text-align: center;
    }

    .impact-node-inner {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 14px;
      border-radius: 20px;
      box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4);
      text-align: center;
    }

    .impact-node-inner span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: white;
      text-align: center;
      display: block;
      line-height: 1.2;
    }

    .impact-node-stat {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      color: white;
      font-family: 'Noto Sans TC', sans-serif;
      justify-content: center;
    }

    .impact-node-stat .label {
      font-size: 15px;
      font-weight: 400;
      line-height: 1.2;
    }

    .impact-node-stat .value {
      font-size: 20px;
      font-weight: 400;
      line-height: 1;
    }

    .impact-node-stat .unit {
      font-size: 15px;
      font-weight: 400;
      line-height: 1.2;
    }

    /* Buttons */
    .button-row {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: flex-end;
      width: 328px;
    }

    .report-btn {
      width: 268px;
      height: 48px;
      background: white;
      border: none;
      border-radius: 24px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: black;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .report-btn:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .report-btn:active {
      transform: scale(0.98);
    }

    .link-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .link-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .link-btn:active {
      transform: scale(0.95);
    }

    .link-btn svg {
      width: 24px;
      height: 24px;
    }

    /* Video gallery section */
    .video-gallery {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .video-gallery-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 700;
      color: black;
      margin: 0;
      line-height: normal;
    }

    .video-gallery-content {
      display: flex;
      align-items: stretch;
    }

    .video-gallery-content.single {
      justify-content: center;
      max-width: 700px;
      margin: 0 auto;
    }

    /* Featured (main player) */
    .video-featured {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .video-divider {
      width: 1px;
      align-self: stretch;
      background: #c0c0c0;
      flex-shrink: 0;
      margin: 0 20px;
    }

    .video-thumb {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      background: #000;
    }

    .video-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Shorts: blurred background + centered contain */
    .video-thumb.is-short-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-thumb.is-short-thumb .thumb-bg-blur {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(20px) brightness(0.4);
      transform: scale(1.1);
      z-index: 0;
    }

    .video-thumb.is-short-thumb img.thumb-main {
      position: relative;
      width: auto;
      height: 100%;
      object-fit: contain;
      z-index: 1;
    }

    .video-thumb-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 20px;
      z-index: 2;
    }

    .video-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 3;
    }

    .video-featured .video-thumb {
      aspect-ratio: 16 / 9;
    }

    .video-featured .video-play-btn {
      width: 68px;
      height: 48px;
    }

    .video-featured iframe {
      width: 100%;
      aspect-ratio: 16 / 9;
      border: none;
      border-radius: 20px;
      display: block;
    }

    .video-featured-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #121212;
      line-height: 1.25;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Side list */
    .video-side {
      display: flex;
      flex-direction: column;
      width: 214px;
      flex-shrink: 0;
      gap: 12px;
    }

    .video-side-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      cursor: pointer;
      border-radius: 12px;
      transition: background 0.2s;
    }

    .video-side-item:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .video-side-item.active {
      background: rgba(14, 38, 105, 0.08);
    }

    .video-side-item .video-thumb {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 20px;
    }

    .video-side-item .video-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .video-side-item .video-play-btn {
      width: 30px;
      height: 25px;
    }

    .video-side-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #121212;
      line-height: 1.25;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* View more button row */
    .video-more-row {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: auto;
    }

    .video-more-btn {
      flex: 1;
      height: 48px;
      background: #0e2669;
      color: white;
      border: none;
      border-radius: 24px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }

    .video-more-btn:hover {
      background: #1a3a8f;
      transform: scale(1.02);
    }

    .video-more-arrow {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0e2669;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
      flex-shrink: 0;
    }

    .video-more-arrow:hover {
      background: #1a3a8f;
      transform: scale(1.05);
    }

    .video-more-arrow svg {
      width: 24px;
      height: 24px;
    }

    /* ── Shorts-only mode ── */
    .shorts-gallery-content {
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .shorts-featured {
      flex-shrink: 0;
      width: 340px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .shorts-featured .video-thumb {
      aspect-ratio: 9 / 16;
      border-radius: 20px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
    }

    .shorts-featured iframe {
      width: 100%;
      aspect-ratio: 9 / 16;
      border: none;
      border-radius: 20px;
      display: block;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
    }

    .shorts-sidebar {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
      min-width: 0;
      justify-content: center;
    }

    .shorts-sidebar-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #121212;
      margin: 0;
    }

    .shorts-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .shorts-card {
      flex: 1 0 0;
      min-width: 120px;
      background: white;
      border: 1px solid rgba(149,170,255,0.2);
      border-radius: 14px;
      padding: 11px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .shorts-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }

    .shorts-card.active {
      border-color: #0e2669;
      box-shadow: 0 0 0 1px #0e2669;
    }

    .shorts-card .video-thumb {
      width: 100%;
      aspect-ratio: 9 / 16;
      border-radius: 7px;
    }

    .shorts-card .video-play-btn {
      width: 32px;
      height: 26px;
    }

    .shorts-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #121212;
      line-height: 1.25;
      margin: 0;
      width: 100%;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Blessings section */
    .blessings-section {
      border: 4px solid white;
      border-radius: 20px;
      padding: 24px 40px 36px 40px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 32px;
      transition: border-color 0.3s;
    }

    .blessings-section.submitted {
      border-color: #1bb06b;
    }

    .blessings-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .blessings-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: black;
      line-height: normal;
      margin: 0;
    }

    .blessings-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.28;
      margin: 0;
    }

    .dialogs-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 20px;
      align-items: center;
      justify-content: center;
    }

    .dialog-item {
      display: flex;
      align-items: center;
      padding-right: 4px;
    }

    .dialog-bubble {
      background: white;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 12px;
      border-radius: 8px;
      margin-right: -4px;
    }

    .dialog-bubble span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: black;
      line-height: 1.25;
      white-space: nowrap;
    }

    .dialog-pointer {
      width: 12px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: -4px;
    }

    .dialog-pointer svg {
      width: 12px;
      height: 16px;
    }

    /* Input section */
    .bless-input-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .bless-feedback-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bless-feedback-title svg {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
    }

    .bless-feedback-title span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: #1bb06b;
      line-height: 1.6;
      white-space: nowrap;
    }

    .bless-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .bless-input-row input {
      flex: 1;
      padding: 8px 16px;
      border: 1px solid rgba(14, 38, 105, 0.6);
      border-radius: 4px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: black;
      line-height: 1.25;
      outline: none;
      background: white;
    }

    .bless-input-row input::placeholder {
      color: rgba(0, 0, 0, 0.38);
      font-weight: 400;
    }

    .bless-submit-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: white;
      line-height: 1.25;
      cursor: pointer;
      white-space: nowrap;
      background: rgba(0, 0, 0, 0.38);
      transition: background 0.2s;
    }

    .bless-submit-btn.active {
      background: #0e2669;
    }

    .bless-submit-btn:disabled {
      cursor: not-allowed;
    }

    .bless-disclaimer {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.28;
      margin: 0;
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  updated() {
    if (!this.videosLoaded && this.config?.video_published === 1 && this.config?.video_playlist_id) {
      this.videosLoaded = true;
      this.loadVideos(this.config.video_playlist_id);
    }
    if (!this.countAnimated && this.sections.length > 0) {
      const card = this.shadowRoot?.querySelector('.graphic-card');
      if (!card) return;
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.countAnimated) {
          this.countAnimated = true;
          this.animateCountUp();
          this.observer?.disconnect();
        }
      }, { threshold: 0.3 });
      this.observer.observe(card);
    }
  }

  private animateCountUp() {
    const card = this.shadowRoot?.querySelector('.graphic-card');
    if (!card) return;
    const valueEls = card.querySelectorAll('.impact-node-stat .value');
    valueEls.forEach((el) => {
      const target = (el as HTMLElement).textContent?.trim() || '';
      const num = parseFloat(target.replace(/,/g, ''));
      if (isNaN(num)) return;
      const hasCommas = target.includes(',');
      const isPercent = target.includes('%');
      const duration = 1500;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        const current = num * ease;
        let display: string;
        if (Number.isInteger(num)) {
          display = hasCommas ? Math.round(current).toLocaleString() : Math.round(current).toString();
        } else {
          display = current.toFixed(target.split('.')[1]?.replace('%', '').length || 0);
        }
        if (isPercent) display += '%';
        (el as HTMLElement).textContent = display;
        if (t < 1) requestAnimationFrame(step);
      };
      (el as HTMLElement).textContent = isPercent ? '0%' : '0';
      requestAnimationFrame(step);
    });
  }

  private async loadVideos(playlistId: string) {
    try {
      const videos = await api.getPlaylistVideos(playlistId);
      this.videos = videos;
      this.isAllShorts = videos.length > 0 && videos.every(v => v.isShort);
    } catch (e) {
      console.error('Failed to load playlist videos:', e);
    }
  }

  private handleVideoSelect(index: number) {
    this.activeVideoIndex = index;
    this.playingVideo = true;
  }

  private playFeatured() {
    this.playingVideo = true;
  }

  private getThumbSrc(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  }

  private getThumbFallback(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  private getEmbedUrl(video: PlaylistVideo): string {
    return `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
  }

  private handleThumbError(e: Event, videoId: string) {
    const img = e.target as HTMLImageElement;
    if (img.src.includes('maxresdefault')) {
      img.src = this.getThumbFallback(videoId);
    }
  }

  private handleThumbLoad(e: Event, videoId: string) {
    const img = e.target as HTMLImageElement;
    if (img.src.includes('maxresdefault') && img.naturalWidth <= 120) {
      img.src = this.getThumbFallback(videoId);
    }
  }

  private async handleBlessSubmit() {
    const msg = this.blessInput.trim();
    if (!msg || this.blessSubmitting) return;
    this.blessSubmitting = true;
    try {
      await api.createBlessingTag(msg);
      this.blessSubmitted = true;
      this.blessInput = '';
    } catch (e) {
      console.error('Failed to submit blessing:', e);
    } finally {
      this.blessSubmitting = false;
    }
  }

  render() {
    const triangleSvg = html`
      <svg viewBox="0 0 200 148" fill="none">
        <path d="M100 5 L195 143 L5 143 Z" stroke="#5fb7fa" stroke-width="2" fill="none"/>
      </svg>
    `;

    const arrowIcon = html`
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#121212" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    const pointerSvg = html`
      <svg viewBox="0 0 12 16" fill="none">
        <path d="M12 8L0 0V16L12 8Z" fill="white"/>
      </svg>
    `;

    const blessingTexts = this.blessingTags.map(t => t.message);

    return html`
      <div class="section-container">
        <!-- Section Title (always visible) -->
        <div class="section-title">${this.config?.published === 1 ? '看影響' : '與善同行'}</div>

        <!-- Report Section -->
        ${this.config?.published === 1 ? html`
        <div class="report-section">
          <!-- Left: Title -->
          <div class="title-section">
            <div class="text-content">
              <h2 class="main-title">${this.config?.main_title || ''}</h2>
              <p class="main-desc">${this.config?.subtitle || ''}</p>
            </div>
          </div>

          <!-- Right: Graphic card -->
          <div class="graphic-card">
            <div class="graphic-area">
              <div class="triangle-svg">
                ${triangleSvg}
              </div>

              <!-- Top node -->
              <div class="impact-node top">
                <div class="impact-node-stat">
                  <span class="label">${this.sections[0]?.stat_label || ''}</span>
                  <span class="value">${this.sections[0]?.stat_value || ''}</span>
                  <span class="unit">${this.sections[0]?.stat_unit || ''}</span>
                </div>
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${(this.sections[0]?.name || '').split(' ').map((w: string, i: number) => i === 0 ? w : html`<br>${w}`)}</span>
                  </div>
                </div>
              </div>

              <!-- Bottom left node -->
              <div class="impact-node bottom-left">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${(this.sections[1]?.name || '').split(' ').map((w: string, i: number) => i === 0 ? w : html`<br>${w}`)}</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">${this.sections[1]?.stat_label || ''}</span>
                  <span class="value">${this.sections[1]?.stat_value || ''}</span>
                  <span class="unit">${this.sections[1]?.stat_unit || ''}</span>
                </div>
              </div>

              <!-- Bottom right node -->
              <div class="impact-node bottom-right">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${(this.sections[2]?.name || '').split(' ').map((w: string, i: number) => i === 0 ? w : html`<br>${w}`)}</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">${this.sections[2]?.stat_label || ''}</span>
                  <span class="value">${this.sections[2]?.stat_value || ''}</span>
                  <span class="unit">${this.sections[2]?.stat_unit || ''}</span>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="button-row">
              <button class="report-btn" @click=${() => { window.open(window.location.origin + '/report/', '_blank'); }}>影響力報告</button>
              <button class="link-btn" @click=${() => { window.open(window.location.origin + '/report/', '_blank'); }}>
                ${arrowIcon}
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Video Gallery Section -->
        ${this.config?.video_published === 1 && this.videos.length > 0 ? html`
        <div class="video-gallery">
          <h3 class="video-gallery-title">${this.config?.video_section_title || '來自全球的祝福'}</h3>

          ${this.isAllShorts ? html`
          <!-- ═══ SHORTS MODE ═══ -->
          ${this.videos.length === 1 ? html`
          <!-- Single short: vertical stack, centered -->
          <div style="display:flex;flex-direction:column;gap:12px;max-width:340px;margin:0 auto;">
            <div class="shorts-featured">
              ${this.playingVideo ? html`
                <iframe
                  src="${this.getEmbedUrl(this.videos[0])}"
                  allow="autoplay; encrypted-media"
                  allowfullscreen
                ></iframe>
              ` : html`
                <div class="video-thumb" @click=${() => this.playFeatured()}>
                  <img class="thumb-main"
                    src="${this.getThumbSrc(this.videos[0].videoId)}"
                    alt="${this.videos[0].title}"
                    @error=${(e: Event) => this.handleThumbError(e, this.videos[0].videoId)}
                    @load=${(e: Event) => this.handleThumbLoad(e, this.videos[0].videoId)}
                  />
                  <div class="video-thumb-overlay"></div>
                  <div class="video-play-btn" style="width:51px;height:42px;">
                    <svg viewBox="0 0 68 48" fill="none">
                      <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/>
                      <path d="M45 24L27 14v20" fill="white"/>
                    </svg>
                  </div>
                </div>
              `}
            </div>
            <p class="video-featured-title">${this.videos[0].title}</p>
            ${this.config?.video_playlist_id ? html`
            <div class="video-more-row">
              <button class="video-more-btn" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>觀看更多</button>
              <button class="video-more-arrow" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7V17"/>
                </svg>
              </button>
            </div>
            ` : ''}
          </div>

          ` : html`
          <!-- 2+ shorts: featured left + sidebar right -->
          <div class="shorts-gallery-content">
            <div class="shorts-featured">
              ${this.playingVideo ? html`
                <iframe
                  src="${this.getEmbedUrl(this.videos[this.activeVideoIndex])}"
                  allow="autoplay; encrypted-media"
                  allowfullscreen
                ></iframe>
              ` : html`
                <div class="video-thumb" @click=${() => this.playFeatured()}>
                  <img class="thumb-main"
                    src="${this.getThumbSrc(this.videos[this.activeVideoIndex].videoId)}"
                    alt="${this.videos[this.activeVideoIndex].title}"
                    @error=${(e: Event) => this.handleThumbError(e, this.videos[this.activeVideoIndex].videoId)}
                    @load=${(e: Event) => this.handleThumbLoad(e, this.videos[this.activeVideoIndex].videoId)}
                  />
                  <div class="video-thumb-overlay"></div>
                  <div class="video-play-btn" style="width:51px;height:42px;">
                    <svg viewBox="0 0 68 48" fill="none">
                      <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/>
                      <path d="M45 24L27 14v20" fill="white"/>
                    </svg>
                  </div>
                </div>
              `}
              <p class="video-featured-title">${this.videos[this.activeVideoIndex].title}</p>
            </div>

            <div class="shorts-sidebar">
              <h4 class="shorts-sidebar-title">影音列表</h4>
              <div class="shorts-grid">
                ${this.videos.filter((_, i) => i !== this.activeVideoIndex).slice(0, 4).map((v) => {
                  const origIndex = this.videos.indexOf(v);
                  return html`
                  <div
                    class="shorts-card"
                    @click=${() => this.handleVideoSelect(origIndex)}
                  >
                    <div class="video-thumb">
                      <img class="thumb-main"
                        src="${this.getThumbSrc(v.videoId)}"
                        alt="${v.title}"
                        @error=${(e: Event) => this.handleThumbError(e, v.videoId)}
                        @load=${(e: Event) => this.handleThumbLoad(e, v.videoId)}
                      />
                      <div class="video-thumb-overlay"></div>
                      <div class="video-play-btn">
                        <svg viewBox="0 0 51 42" fill="none">
                          <rect width="51" height="42" rx="10" fill="rgba(0,0,0,0.5)"/>
                          <path d="M20 12L36 21L20 30V12Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                    <p class="shorts-card-title">${v.title}</p>
                  </div>
                `; })}
              </div>
              ${this.config?.video_playlist_id ? html`
              <div class="video-more-row" style="justify-content:stretch;">
                <button class="video-more-btn" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>觀看更多</button>
                <button class="video-more-arrow" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7V17"/>
                  </svg>
                </button>
              </div>
              ` : ''}
            </div>
          </div>
          `}

          ` : html`
          <!-- ═══ VIDEO MODE ═══ -->
          <div class="video-gallery-content ${this.videos.length === 1 ? 'single' : ''}">
            <div class="video-featured">
              ${this.playingVideo ? html`
                <iframe
                  src="${this.getEmbedUrl(this.videos[this.activeVideoIndex])}"
                  allow="autoplay; encrypted-media"
                  allowfullscreen
                ></iframe>
              ` : html`
                <div class="video-thumb ${this.videos[this.activeVideoIndex]?.isShort ? 'is-short-thumb' : ''}" @click=${() => this.playFeatured()}>
                  ${this.videos[this.activeVideoIndex]?.isShort ? html`
                    <img class="thumb-bg-blur" src="${this.getThumbSrc(this.videos[this.activeVideoIndex].videoId)}" alt="" />
                  ` : ''}
                  <img
                    class="thumb-main"
                    src="${this.getThumbSrc(this.videos[this.activeVideoIndex].videoId)}"
                    alt="${this.videos[this.activeVideoIndex].title}"
                    @error=${(e: Event) => this.handleThumbError(e, this.videos[this.activeVideoIndex].videoId)}
                    @load=${(e: Event) => this.handleThumbLoad(e, this.videos[this.activeVideoIndex].videoId)}
                  />
                  <div class="video-thumb-overlay"></div>
                  <div class="video-play-btn">
                    <svg viewBox="0 0 68 48" fill="none">
                      <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/>
                      <path d="M45 24L27 14v20" fill="white"/>
                    </svg>
                  </div>
                </div>
              `}
              <p class="video-featured-title">${this.videos[this.activeVideoIndex].title}</p>
            </div>
            ${this.videos.length > 1 ? html`
            <div class="video-divider"></div>
            <div class="video-side">
              ${this.videos.filter((_, i) => i !== this.activeVideoIndex).slice(0, 3).map((v) => {
                const origIndex = this.videos.indexOf(v);
                return html`
                <div
                  class="video-side-item"
                  @click=${() => this.handleVideoSelect(origIndex)}
                >
                  <div class="video-thumb ${v.isShort ? 'is-short-thumb' : ''}">
                    ${v.isShort ? html`
                      <img class="thumb-bg-blur" src="${this.getThumbSrc(v.videoId)}" alt="" />
                    ` : ''}
                    <img
                      class="thumb-main"
                      src="${this.getThumbSrc(v.videoId)}"
                      alt="${v.title}"
                      @error=${(e: Event) => this.handleThumbError(e, v.videoId)}
                      @load=${(e: Event) => this.handleThumbLoad(e, v.videoId)}
                    />
                    <div class="video-thumb-overlay"></div>
                    <div class="video-play-btn">
                      <svg viewBox="0 0 51 42" fill="none">
                        <rect width="51" height="42" rx="10" fill="rgba(0,0,0,0.5)"/>
                        <path d="M20 12L36 21L20 30V12Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                  <p class="video-side-title">${v.title}</p>
                </div>
              `; })}
              ${this.config?.video_playlist_id ? html`
              <div class="video-more-row">
                <button class="video-more-btn" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>觀看更多</button>
                <button class="video-more-arrow" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.config!.video_playlist_id}`, '_blank')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7V17"/>
                  </svg>
                </button>
              </div>
              ` : ''}
            </div>
            ` : ''}
          </div>
          `}
        </div>
        ` : ''}

        <!-- Blessings Section -->
        ${this.config?.blessing_published === 1 ? html`
        <div class="blessings-section ${this.blessSubmitted ? 'submitted' : ''}">
          <div class="blessings-header">
            <h3 class="blessings-title">${this.config?.blessing_title || '傳送希望 獻上對世界的祝福'}</h3>
            <p class="blessings-subtitle">聽見您對世界的輕聲祝福（以下祝福語為隨機呈現）</p>
          </div>
          <div class="dialogs-wrapper">
            ${blessingTexts.map(msg => html`
              <div class="dialog-item">
                <div class="dialog-bubble">
                  <span>${msg}</span>
                </div>
                <div class="dialog-pointer">
                  ${pointerSvg}
                </div>
              </div>
            `)}
          </div>
          <div class="bless-input-section">
            ${this.blessSubmitted ? html`
              <div class="bless-feedback-title">
                <svg viewBox="0 0 38 38" fill="none">
                  <circle cx="19" cy="19" r="16" fill="#1bb06b"/>
                  <path d="M12 19.5L16.5 24L26 14.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>已送出祝福！</span>
              </div>
            ` : ''}
            <div class="bless-input-row">
              <input
                type="text"
                placeholder="輸入祝福語"
                .value=${this.blessInput}
                @input=${(e: InputEvent) => { this.blessInput = (e.target as HTMLInputElement).value; }}
                @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.handleBlessSubmit(); }}
              />
              ${this.blessSubmitted ? html`
                <button class="bless-submit-btn" disabled>完成</button>
              ` : html`
                <button
                  class="bless-submit-btn ${this.blessInput.trim() ? 'active' : ''}"
                  ?disabled=${!this.blessInput.trim() || this.blessSubmitting}
                  @click=${this.handleBlessSubmit}
                >送出</button>
              `}
            </div>
            <p class="bless-disclaimer">* AI執勤中，唯有溫暖、正向語彙可通關。</p>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-impact': DesktopImpact;
  }
}
