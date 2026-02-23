import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ImpactSection, ImpactConfig, BlessingTag } from '../services/api.js';

@customElement('desktop-impact')
export class DesktopImpact extends LitElement {
  @property({ type: Array })
  sections: ImpactSection[] = [];

  @property({ type: Object })
  config: ImpactConfig | null = null;

  @property({ type: Array })
  blessingTags: BlessingTag[] = [];

  private countAnimated = false;
  private observer: IntersectionObserver | null = null;

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
      align-items: flex-start;
    }

    /* Left: Title */
    .title-section {
      flex: 1;
      padding-bottom: 60px;
      display: flex;
      flex-direction: column;
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
      top: 176px;
      left: 0;
    }

    .impact-node.bottom-right {
      top: 176px;
      right: 0;
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
      font-size: 18px;
      font-weight: 500;
      color: white;
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

    /* Blessings section */
    .blessings-section {
      border: 4px solid white;
      border-radius: 20px;
      padding: 24px 40px 36px 40px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .blessings-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 24px;
      font-weight: 500;
      color: #0e2669;
      line-height: 1.6;
      margin: 0;
    }

    .dialogs-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 16px 20px;
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
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  updated() {
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
        <div class="section-title">看影響</div>

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
                    <span>${this.sections[0]?.name || ''}</span>
                  </div>
                </div>
              </div>

              <!-- Bottom left node -->
              <div class="impact-node bottom-left">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${this.sections[1]?.name || ''}</span>
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
                    <span>${this.sections[2]?.name || ''}</span>
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
              <button class="report-btn">影響力報告</button>
              <button class="link-btn">
                ${arrowIcon}
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Blessings Section -->
        ${this.config?.blessing_published === 1 ? html`
        <div class="blessings-section">
          <h3 class="blessings-title">${this.config?.blessing_title || '傳送祝福 灌溉希望'}</h3>
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
