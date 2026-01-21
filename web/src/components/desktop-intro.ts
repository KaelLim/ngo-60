import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('desktop-intro')
export class DesktopIntro extends LitElement {
  @property({ type: String })
  title = '';

  @property({ type: String })
  content = '';

  static styles = css`
    :host {
      display: block;
    }

    .intro-container {
      padding: 60px 40px;
    }

    .intro-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 24px;
      line-height: 1.4;
      color: #121212;
      margin: 0 0 16px 0;
    }

    .intro-content {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 16px;
      line-height: 1.6;
      color: #121212;
      margin: 0;
      white-space: pre-line;
    }
  `;

  render() {
    return html`
      <div class="intro-container">
        <h2 class="intro-title">${this.title}</h2>
        <p class="intro-content">${this.content}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'desktop-intro': DesktopIntro;
  }
}
