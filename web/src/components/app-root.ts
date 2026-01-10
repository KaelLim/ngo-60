import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { dataContext } from '../contexts/data-context.js';
import { appStore, AppStore } from '../stores/app-store.js';
import { dataStore, DataStore } from '../stores/data-store.js';

import './app-shell.js';

@customElement('app-root')
export class AppRoot extends LitElement {
  @provide({ context: appContext })
  appStore: AppStore = appStore;

  @provide({ context: dataContext })
  dataStore: DataStore = dataStore;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      max-width: 430px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
      background: #0e2669;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // 初始化載入資料
    this.dataStore.loadAllData(this.appStore.selectedMonth, this.appStore.selectedYear);
  }

  render() {
    return html`<app-shell></app-shell>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
