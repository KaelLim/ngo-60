import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type TabType = 'schedule' | 'topics' | 'impact';

@customElement('homepage-tabs')
export class HomepageTabs extends LitElement {
  @property({ type: String })
  activeTab: TabType = 'topics';

  static styles = css`
    :host {
      display: block;
      width: 100%;
      padding: 0 12px;
      box-sizing: border-box;
    }

    .menu {
      display: flex;
      align-items: center;
      background-color: white;
      border-radius: 30px;
      padding-right: 16px;
      overflow: hidden;
    }

    .tab {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 19px 40px;
      border-radius: 30px;
      margin-right: -16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      background: transparent;
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 16px;
      line-height: 1.4;
      color: #121212;
      white-space: nowrap;
    }

    .tab:last-child {
      margin-right: 0;
    }

    .tab.active {
      background-color: #121212;
      color: white;
    }

    .tab:hover:not(.active) {
      background-color: rgba(0, 0, 0, 0.05);
    }
  `;

  private handleClick(tab: TabType) {
    this.activeTab = tab;
    this.dispatchEvent(new CustomEvent('tab-change', {
      detail: tab,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="menu">
        <button
          class="tab ${this.activeTab === 'schedule' ? 'active' : ''}"
          @click=${() => this.handleClick('schedule')}
        >
          看時程
        </button>
        <button
          class="tab ${this.activeTab === 'topics' ? 'active' : ''}"
          @click=${() => this.handleClick('topics')}
        >
          看主題
        </button>
        <button
          class="tab ${this.activeTab === 'impact' ? 'active' : ''}"
          @click=${() => this.handleClick('impact')}
        >
          看影響
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'homepage-tabs': HomepageTabs;
  }
}
