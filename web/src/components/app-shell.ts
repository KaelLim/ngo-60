import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { GestureController } from '../controllers/gesture-controller.js';

import './app-poster.js';
import './app-sheet.js';
import './blessing-page.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  private storeController!: StoreController;
  private gestureController!: GestureController;

  @query('.main-container')
  private mainContainer!: HTMLElement;

  @query('.homepage-content')
  private homepageContent!: HTMLElement;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      position: relative;
      overflow: hidden;
      background: #0e2669;
    }

    .main-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: transform;
    }

    .main-container.dragging {
      transition: none;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);
    this.gestureController = new GestureController(
      this,
      this.appStore,
      () => this.mainContainer,
      () => this.homepageContent
    );

    // Initialize position
    this.appStore.setSheetState('peek');

    // Set viewport height
    this.setVH();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('popstate', this.handlePopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('popstate', this.handlePopState);
  }

  private setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  private handleResize = () => {
    this.setVH();
    this.appStore.setSheetState(this.appStore.sheetState);
  };

  private handlePopState = () => {
    this.appStore.handleRoute();
  };

  render() {
    const containerStyle = `transform: translateY(${this.appStore.containerY}px)`;
    const isDragging = this.appStore.isDragging;
    const currentPage = this.appStore.currentPage;

    return html`
      <div
        class="main-container ${isDragging ? 'dragging' : ''}"
        style=${containerStyle}
        @touchstart=${this.gestureController.onTouchStart}
        @touchmove=${this.gestureController.onTouchMove}
        @touchend=${this.gestureController.onTouchEnd}
        @mousedown=${this.gestureController.onMouseDown}
      >
        <app-poster></app-poster>
        <app-sheet></app-sheet>
      </div>

      ${currentPage === 'blessing' ? html`<blessing-page></blessing-page>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
