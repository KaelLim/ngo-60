import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { appContext } from '../contexts/app-context.js';
import { AppStore } from '../stores/app-store.js';
import { StoreController } from '../controllers/store-controller.js';
import { api, Topic, Event, ImpactSection, ImpactConfig, Blessing, BlessingTag, PlaylistVideo } from '../services/api.js';

import './homepage-tabs.js';

@customElement('sheet-content')
export class SheetContent extends LitElement {
  @consume({ context: appContext })
  appStore!: AppStore;

  @property({ type: Boolean, reflect: true })
  desktopMode = false;

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
  private impactConfig: ImpactConfig | null = null;

  @state()
  private blessings: Blessing[] = [];

  @state()
  private activeMonths: number[] = [];

  @state()
  private videos: PlaylistVideo[] = [];

  @state()
  private isAllShorts = false;

  @state()
  private activeMobileShortIndex = 0;

  @state()
  private playingMobileVideoId: string | null = null;

  @state()
  private loading = false;

  private storeController!: StoreController<AppStore>;
  private blessIntervalId: number | null = null;
  private impactCountAnimated = false;

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
    .topic-card, .impact-card, .schedule-card {
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

    /* ========== Topic card styles (Bottom overlay) ========== */
    .topic-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      animation: contentFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .topic-list .topic-card {
      animation: topicCardIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .topic-list .topic-card:nth-child(1) { animation-delay: 0.1s; }
    .topic-list .topic-card:nth-child(2) { animation-delay: 0.18s; }
    .topic-list .topic-card:nth-child(3) { animation-delay: 0.26s; }
    .topic-list .topic-card:nth-child(4) { animation-delay: 0.34s; }
    .topic-list .topic-card:nth-child(5) { animation-delay: 0.42s; }
    .topic-list .topic-card:nth-child(6) { animation-delay: 0.50s; }

    @keyframes topicCardIn {
      from {
        opacity: 0;
        transform: translateX(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .topic-card {
      height: 208px;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
    }

    .topic-card:active {
      transform: scale(0.98);
    }

    .topic-card-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
    }

    .topic-card-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(14, 38, 105, 0.9);
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border-radius: 20px;
    }

    .topic-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .topic-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 700;
      font-size: 20px;
      line-height: 1.2;
      color: white;
      margin: 0;
    }

    .topic-card-divider {
      width: 1px;
      height: 19px;
      background: white;
    }

    .topic-card-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 500;
      font-size: 20px;
      line-height: 1.2;
      color: white;
      margin: 0;
    }

    .topic-card-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .topic-card-desc {
      font-family: 'Noto Sans TC', sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.4;
      color: white;
      margin: 0;
      width: 244px;
      height: 40px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      text-overflow: ellipsis;
    }

    .topic-card-arrow {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition:
        background-color 0.25s ease,
        transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .topic-card:hover .topic-card-arrow {
      background: rgba(255, 255, 255, 0.35);
      transform: scale(1.1);
    }

    .topic-card-arrow svg {
      width: 20px;
      height: 20px;
      color: white;
      transition: transform 0.25s ease;
    }

    .topic-card:hover .topic-card-arrow svg {
      transform: translate(2px, -2px);
    }

    /* ========== Impact Tab Styles ========== */
    .impact-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 4px 0;
      animation: contentFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .impact-report {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.1s;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      animation: cardScaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.2s;
    }

    @keyframes cardScaleIn {
      from {
        opacity: 0;
        transform: scale(0.92);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
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
      animation: triangleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.4s;
    }

    @keyframes triangleIn {
      from {
        opacity: 0;
        transform: translateX(-50%) scale(0.8);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
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
      animation: nodeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }

    @keyframes nodeIn {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .impact-node.top {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 138px;
      animation: nodeTopIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      animation-delay: 0.5s;
    }

    @keyframes nodeTopIn {
      from {
        opacity: 0;
        transform: translateX(-50%) scale(0.5);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
    }

    .impact-node.bottom-left {
      top: 149px;
      left: 0;
      width: 120px;
      animation-delay: 0.6s;
    }

    .impact-node.bottom-right {
      top: 149px;
      right: 0;
      width: 137px;
      animation-delay: 0.7s;
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
      animation: buttonsIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.6s;
    }

    @keyframes buttonsIn {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
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
      transition:
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
    }

    .impact-report-btn:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
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
      transition:
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
    }

    .impact-link-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .impact-link-btn:active {
      transform: scale(0.95);
    }

    .impact-link-btn svg {
      width: 24px;
      height: 24px;
    }

    /* Video Section */
    .video-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.2s;
    }

    .video-section-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: black;
      margin: 0;
      line-height: 1.25;
    }

    .video-scroll-wrapper {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      margin: 0 -12px;
      padding: 0 12px;
      scrollbar-width: none;
    }

    .video-scroll-wrapper::-webkit-scrollbar {
      display: none;
    }

    .video-scroll-row {
      display: flex;
      gap: 8px;
    }

    .video-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
      width: 305px;
      cursor: pointer;
    }

    .video-card-thumb {
      position: relative;
      width: 100%;
      aspect-ratio: 305 / 172;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      background: transparent;
    }

    .video-card-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transform: scale(1.02);
    }

    .video-card-thumb.is-short-thumb {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-card-thumb.is-short-thumb .thumb-bg-blur {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(20px) brightness(0.4);
      transform: scale(1.1);
      z-index: 0;
    }

    .video-card-thumb.is-short-thumb img.thumb-main {
      position: relative;
      width: auto;
      height: 100%;
      object-fit: contain;
      z-index: 1;
    }

    .video-card-thumb-overlay {
      position: absolute;
      inset: -1px;
      background: rgba(0, 0, 0, 0.4);
      z-index: 2;
    }

    .video-card-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 51px;
      height: 42px;
      pointer-events: none;
      z-index: 3;
    }

    .video-card-play svg {
      width: 100%;
      height: 100%;
    }

    .video-card iframe {
      width: 100%;
      aspect-ratio: 305 / 172;
      border: none;
      border-radius: 20px;
      display: block;
    }

    .video-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: #121212;
      line-height: 1.28;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Mobile Shorts Mode ── */
    .mobile-shorts-featured {
      width: 100%;
      aspect-ratio: 9 / 16;
      border-radius: 18px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      box-shadow: 0 19px 38px -9px rgba(0,0,0,0.25);
    }

    .mobile-shorts-featured img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transform: scale(1.02);
    }

    .mobile-shorts-featured iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    }

    .mobile-shorts-featured .shorts-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 40%, transparent 60%);
      z-index: 1;
    }

    .mobile-shorts-featured .shorts-play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 51px;
      height: 42px;
      z-index: 2;
      pointer-events: none;
    }

    .mobile-shorts-featured .shorts-play svg {
      width: 100%;
      height: 100%;
    }

    .mobile-shorts-featured .shorts-title-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      z-index: 2;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: white;
      line-height: 1.3;
      text-shadow: 0 1px 4px rgba(0,0,0,0.5);
    }

    .mobile-shorts-playlist-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #121212;
      margin: 0;
    }

    .mobile-shorts-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .mobile-shorts-grid.scrollable {
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      justify-content: flex-start;
      margin: 0 -12px;
      padding: 0 12px;
    }

    .mobile-shorts-grid.scrollable::-webkit-scrollbar {
      display: none;
    }


    .mobile-shorts-card {
      width: 147px;
      flex-shrink: 0;
      background: white;
      border: 1px solid rgba(149,170,255,0.2);
      border-radius: 14px;
      padding: 11px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      cursor: pointer;
      box-sizing: border-box;
    }

    .mobile-shorts-card .shorts-thumb {
      width: 100%;
      aspect-ratio: 9 / 16;
      border-radius: 7px;
      overflow: hidden;
      position: relative;
      background: transparent;
    }

    .mobile-shorts-card .shorts-thumb img {
      width: calc(100% + 2px);
      height: calc(100% + 2px);
      margin: -1px;
      object-fit: cover;
      display: block;
    }

    .mobile-shorts-card .shorts-thumb .shorts-thumb-overlay {
      position: absolute;
      inset: -1px;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mobile-shorts-card .shorts-thumb .shorts-thumb-play {
      width: 32px;
      height: 26px;
    }

    .mobile-shorts-card .shorts-thumb .shorts-thumb-play svg {
      width: 100%;
      height: 100%;
    }

    .mobile-shorts-card-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #121212;
      line-height: 1.25;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .mobile-shorts-more-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .mobile-shorts-more-btn {
      flex: 1;
      background: #0e2669;
      border: none;
      border-radius: 24px;
      padding: 13px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      text-align: center;
    }

    .mobile-shorts-more-arrow {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0e2669;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
    }

    .mobile-shorts-more-arrow svg {
      width: 20px;
      height: 20px;
    }

    /* Bless Section */
    .bless-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.3s;
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
      cursor: pointer;
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

    /* Bless Modal (native dialog) */
    .bless-modal-dialog {
      border: none;
      padding: 0;
      background: #e4ddd4;
      border-radius: 20px;
      width: calc(100% - 24px);
      max-width: 351px;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    }

    .bless-modal-dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }

    .bless-modal-dialog[open] {
      animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .bless-modal-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 40px;
      height: 40px;
      border: none;
      background: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .bless-modal-close svg {
      width: 24px;
      height: 24px;
    }

    .bless-modal-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 16px 24px;
    }

    .bless-modal-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      width: 100%;
    }

    .bless-modal-title {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: black;
      line-height: 1.25;
      margin: 0;
      text-align: center;
    }

    .bless-modal-subtitle {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.28;
      margin: 0;
      text-align: center;
    }

    .bless-modal-dialogs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 4px;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .bless-modal-dialog-item {
      display: flex;
      align-items: center;
      padding-right: 4px;
    }

    .bless-modal-dialog-bubble {
      background: white;
      padding: 0 12px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: -4px;
    }

    .bless-modal-dialog-bubble span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: black;
      line-height: 1.25;
    }

    .bless-modal-dialog-pointer {
      width: 12px;
      height: 16px;
      margin-left: -4px;
    }

    .bless-modal-dialog-pointer svg {
      width: 100%;
      height: 100%;
    }

    .bless-modal-input-row {
      display: flex;
      gap: 4px;
      align-items: center;
      width: 100%;
    }

    .bless-modal-input {
      flex: 1;
      min-width: 0;
      border: 2px solid rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      padding: 8px 16px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: black;
      background: white;
      outline: none;
    }

    .bless-modal-input::placeholder {
      color: rgba(0, 0, 0, 0.6);
      font-weight: 700;
    }

    .bless-modal-input:focus {
      border-color: #0e2669;
    }

    .bless-modal-submit {
      background: #0e2669;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: white;
      cursor: pointer;
      flex-shrink: 0;
      white-space: nowrap;
    }

    .bless-modal-submit:active {
      opacity: 0.8;
    }

    .bless-modal-submit.done {
      background: rgba(0, 0, 0, 0.38);
    }

    .bless-modal-input-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bless-modal-input-section.submitted {
      border: 2px solid #1bb06b;
      border-radius: 8px;
      padding: 16px;
      align-items: center;
    }

    .bless-modal-feedback {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .bless-modal-feedback span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 20px;
      font-weight: 500;
      color: #1bb06b;
      line-height: 1.6;
    }

    .bless-modal-input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }

    .bless-modal-disclaimer {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.28;
      margin: 0;
    }

    /* ========== Schedule Tab Styles ========== */
    .schedule-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: contentFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .year-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      animation-delay: 0.1s;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      padding: 8px 12px 8px 12px;
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
      transition:
        background-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
      color: #121212;
      animation: monthCardIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .month-card:nth-child(1) { animation-delay: 0.05s; }
    .month-card:nth-child(2) { animation-delay: 0.08s; }
    .month-card:nth-child(3) { animation-delay: 0.11s; }
    .month-card:nth-child(4) { animation-delay: 0.14s; }
    .month-card:nth-child(5) { animation-delay: 0.17s; }
    .month-card:nth-child(6) { animation-delay: 0.20s; }
    .month-card:nth-child(7) { animation-delay: 0.23s; }
    .month-card:nth-child(8) { animation-delay: 0.26s; }
    .month-card:nth-child(9) { animation-delay: 0.29s; }
    .month-card:nth-child(10) { animation-delay: 0.32s; }
    .month-card:nth-child(11) { animation-delay: 0.35s; }
    .month-card:nth-child(12) { animation-delay: 0.38s; }

    @keyframes monthCardIn {
      from {
        opacity: 0;
        transform: translateX(-10px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .month-card:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .month-card:active {
      transform: scale(0.95);
    }

    .month-card.active {
      background: #0e2669;
      color: white;
    }

    .month-card.disabled {
      background: rgba(169, 169, 169, 0.5);
      color: #121212;
      cursor: default;
      pointer-events: none;
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
      transition:
        transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.2s ease;
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
      position: relative;
    }

    .event-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .coming-soon-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #0e2669;
      border-radius: 12px 0 12px 0;
      padding: 10px;
      width: 44px;
      box-sizing: border-box;
    }

    .coming-soon-badge span {
      font-family: 'Noto Sans TC', sans-serif;
      font-size: 12px;
      font-weight: 900;
      line-height: 14px;
      color: rgba(255, 255, 255, 0.85);
      display: block;
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

  @state()
  private blessMessages: string[] = [];

  @state()
  private blessModalOpen = false;

  @state()
  private blessInputValue = '';

  @state()
  private blessSubmitted = false;

  connectedCallback() {
    super.connectedCallback();
    this.storeController = new StoreController(this, this.appStore);

    // Start bless highlight rotation every 5 seconds
    this.blessIntervalId = window.setInterval(() => {
      if (this.blessMessages.length > 0) {
        this.blessHighlightIndex = (this.blessHighlightIndex + 1) % this.blessMessages.length;
      }
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

  updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (this.appStore.activeTab === 'impact' && !this.impactCountAnimated && this.impactSections.length > 0) {
      this.impactCountAnimated = true;
      requestAnimationFrame(() => this.animateCountUp());
    }
  }

  private animateCountUp() {
    const container = this.shadowRoot?.querySelector('.impact-container');
    if (!container) return;
    const valueEls = container.querySelectorAll('.impact-node-stat .value');
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

  private async loadData() {
    this.loading = true;
    try {
      const requestedMonth = this.appStore.selectedMonth;
      const requestedYear = this.appStore.selectedYear;

      // Load all data in parallel
      const [topics, events, activeMonths, impactSections, impactConfig, blessings, blessingTags] = await Promise.all([
        api.getTopics(),
        api.getEvents({ month: requestedMonth, year: requestedYear }),
        api.getActiveMonths(requestedYear),
        api.getImpactSections(),
        api.getImpactConfig(),
        api.getBlessings(true), // Get featured blessings
        api.getBlessingTags()
      ]);

      this.topics = topics;
      this.activeMonths = activeMonths;
      this.impactSections = impactSections;

      // If requested month has no events, auto-select nearest future active month
      if (activeMonths.length > 0 && !activeMonths.includes(requestedMonth)) {
        const futureMonth = activeMonths.find(m => m > requestedMonth);
        const fallback = activeMonths[0];
        const newMonth = futureMonth ?? fallback;
        this.appStore.setSelectedMonth(newMonth);
        this.events = await api.getEvents({ month: newMonth, year: requestedYear });
      } else {
        this.appStore.setSelectedMonth(requestedMonth);
        this.events = events;
      }
      this.impactConfig = impactConfig;
      this.blessings = blessings;
      this.blessMessages = blessingTags.map((t: BlessingTag) => t.message);

      // Load playlist videos if configured
      if (impactConfig?.video_published === 1 && impactConfig?.video_playlist_id) {
        api.getPlaylistVideos(impactConfig.video_playlist_id).then(videos => {
          this.videos = videos;
          this.isAllShorts = videos.length > 0 && videos.every(v => v.isShort);
        }).catch(e => console.error('Failed to load playlist videos:', e));
      }
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

  private openBlessModal() {
    this.blessModalOpen = true;
    this.updateComplete.then(() => {
      const dialog = this.shadowRoot?.querySelector('.bless-modal-dialog') as HTMLDialogElement;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  private closeBlessModal() {
    const dialog = this.shadowRoot?.querySelector('.bless-modal-dialog') as HTMLDialogElement;
    if (dialog?.open) dialog.close();
    this.blessModalOpen = false;
    this.blessInputValue = '';
    this.blessSubmitted = false;
  }

  private async submitBlessing() {
    const msg = this.blessInputValue.trim();
    if (!msg) return;
    try {
      await api.createBlessingTag(msg);
      this.blessMessages = [...this.blessMessages, msg];
      this.blessSubmitted = true;
    } catch (e) {
      console.error('Failed to submit blessing:', e);
    }
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}.${day}`;
  }

  private getParticipationText(event: Event): string {
    return event.participation_type || '';
  }

  private handleEventClick(event: Event) {
    if (event.link_url) {
      window.open(event.link_url, '_blank');
    }
  }

  private renderTopics() {
    if (this.loading) {
      return html`<div class="loading">載入中...</div>`;
    }

    return html`
      <div class="topic-list">
        ${this.topics.map((topic) => html`
          <div
            class="topic-card"
            @click=${() => this.handleTopicClick(topic.id)}
          >
            <div
              class="topic-card-bg"
              style="background-image: url('${topic.background_image || ''}')"
            ></div>
            <div class="topic-card-overlay">
              <div class="topic-card-header">
                <p class="topic-card-title">${topic.name}</p>
                <div class="topic-card-divider"></div>
                <p class="topic-card-subtitle">${topic.subtitle || ''}</p>
              </div>
              <div class="topic-card-body">
                <p class="topic-card-desc">${topic.description || ''}</p>
                <div class="topic-card-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M14 5l5 7-5 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        `)}
      </div>
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


    return html`
      <div class="schedule-container">
        <div class="year-section">
          <h2 class="year-header">${selectedYear}</h2>
          <div class="month-grid-wrapper">
            <div class="month-grid">
              ${this.months.map((monthData, index) => {
                const month = index + 1;
                const hasEvents = this.activeMonths.includes(month);
                const isActive = selectedMonth === month;
                return html`
                  <div
                    class="month-card ${!hasEvents ? 'disabled' : isActive ? 'active' : ''}"
                    @click=${() => hasEvents ? this.handleMonthClick(month) : undefined}
                  >
                    <span class="month-num">${month} <span>月</span></span>
                    <span class="month-label">${monthData.en}</span>
                  </div>
                `;
              })}
            </div>
          </div>
        </div>

        <div class="schedule-events">
          ${this.loading ? html`<div class="loading">載入中...</div>` :
            this.events.length > 0 ? this.events.map(event => html`
              <div class="event-card" @click=${() => this.handleEventClick(event)} style="${event.link_url ? 'cursor: pointer;' : ''}">
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
                  <img src="${event.image_url || ''}" alt="${event.title}" />
                  ${!event.link_url ? html`
                    <div class="coming-soon-badge">
                      <span>敬請</span>
                      <span>期待</span>
                    </div>
                  ` : ''}
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

    return html`
      <div class="impact-container">
        <!-- Report Section -->
        ${this.impactConfig?.published === 1 ? html`
        <div class="impact-report">
          <div class="impact-title-section">
            <h2 class="impact-main-title">${this.impactConfig?.main_title || ''}</h2>
            <p class="impact-subtitle">${this.impactConfig?.subtitle || ''}</p>
          </div>

          <div class="impact-report-card">
            <div class="impact-graphic">
              <div class="impact-triangle">
                ${triangleSvg}
              </div>

              <!-- Top node -->
              <div class="impact-node top">
                <div class="impact-node-stat">
                  <span class="label">${this.impactSections[0]?.stat_label || ''}</span>
                  <span class="value">${this.impactSections[0]?.stat_value || ''}</span>
                  <span class="unit">${this.impactSections[0]?.stat_unit || ''}</span>
                </div>
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${this.impactSections[0]?.name || ''}</span>
                  </div>
                </div>
              </div>

              <!-- Bottom left node -->
              <div class="impact-node bottom-left">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${this.impactSections[1]?.name || ''}</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">${this.impactSections[1]?.stat_label || ''}</span>
                  <span class="value">${this.impactSections[1]?.stat_value || ''}</span>
                  <span class="unit">${this.impactSections[1]?.stat_unit || ''}</span>
                </div>
              </div>

              <!-- Bottom right node -->
              <div class="impact-node bottom-right">
                <div class="impact-node-badge">
                  <div class="impact-node-inner">
                    <span>${this.impactSections[2]?.name || ''}</span>
                  </div>
                </div>
                <div class="impact-node-stat">
                  <span class="label">${this.impactSections[2]?.stat_label || ''}</span>
                  <span class="value">${this.impactSections[2]?.stat_value || ''}</span>
                  <span class="unit">${this.impactSections[2]?.stat_unit || ''}</span>
                </div>
              </div>
            </div>

            <!-- Buttons -->
            <div class="impact-buttons">
              <button class="impact-report-btn" @click=${() => { window.open(window.location.origin + '/report/', '_blank'); }}>影響力報告</button>
              <button class="impact-link-btn" @click=${() => { window.open(window.location.origin + '/report/', '_blank'); }}>
                ${arrowIcon}
              </button>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Video Section -->
        ${this.impactConfig?.video_published === 1 && this.videos.length > 0 ? html`
        <div class="video-section">
          <h3 class="video-section-title">${this.impactConfig?.video_section_title || '來自全球的祝福'}</h3>

          ${this.isAllShorts ? html`
          <!-- ═══ MOBILE SHORTS MODE ═══ -->
          <!-- Featured Short -->
          <div class="mobile-shorts-featured">
            ${this.playingMobileVideoId === this.videos[this.activeMobileShortIndex].videoId ? html`
              <iframe
                src="https://www.youtube.com/embed/${this.videos[this.activeMobileShortIndex].videoId}?autoplay=1"
                allow="autoplay; encrypted-media"
                allowfullscreen
              ></iframe>
            ` : html`
              <img
                src="https://i.ytimg.com/vi/${this.videos[this.activeMobileShortIndex].videoId}/maxresdefault.jpg"
                alt="${this.videos[this.activeMobileShortIndex].title}"
                @error=${(e: Event) => { const img = e.target as HTMLImageElement; if (img.src.includes('maxresdefault')) img.src = `https://i.ytimg.com/vi/${this.videos[this.activeMobileShortIndex].videoId}/hqdefault.jpg`; }}
                @click=${() => { this.playingMobileVideoId = this.videos[this.activeMobileShortIndex].videoId; }}
              />
              <div class="shorts-overlay"></div>
              <div class="shorts-play" @click=${() => { this.playingMobileVideoId = this.videos[this.activeMobileShortIndex].videoId; }}>
                <svg viewBox="0 0 68 48" fill="none">
                  <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red"/>
                  <path d="M45 24L27 14v20" fill="white"/>
                </svg>
              </div>
              <div class="shorts-title-overlay">${this.videos[this.activeMobileShortIndex].title}</div>
            `}
          </div>

          <!-- Playlist Grid -->
          ${this.videos.length > 1 ? html`
          <h4 class="mobile-shorts-playlist-title">影音列表</h4>
          <div class="mobile-shorts-grid ${this.videos.filter((_, i) => i !== this.activeMobileShortIndex).slice(0, 4).length > 2 ? 'scrollable' : ''}">
            ${this.videos.filter((_, i) => i !== this.activeMobileShortIndex).slice(0, 4).map((v) => {
              const origIndex = this.videos.indexOf(v);
              return html`
              <div class="mobile-shorts-card" @click=${() => { this.activeMobileShortIndex = origIndex; this.playingMobileVideoId = null; }}>
                <div class="shorts-thumb">
                  <img
                    src="https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg"
                    alt="${v.title}"
                    @error=${(e: Event) => { const img = e.target as HTMLImageElement; if (img.src.includes('maxresdefault')) img.src = `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`; }}
                  />
                  <div class="shorts-thumb-overlay">
                    <div class="shorts-thumb-play">
                      <svg viewBox="0 0 51 42" fill="none">
                        <rect width="51" height="42" rx="10" fill="rgba(0,0,0,0.5)"/>
                        <path d="M20 12L36 21L20 30V12Z" fill="white"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <p class="mobile-shorts-card-title">${v.title}</p>
              </div>
            `; })}
          </div>
          ` : ''}

          <!-- 觀看更多 -->
          ${this.impactConfig?.video_playlist_id ? html`
          <div class="mobile-shorts-more-row">
            <button class="mobile-shorts-more-btn" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.impactConfig!.video_playlist_id}`, '_blank')}>觀看更多</button>
            <button class="mobile-shorts-more-arrow" @click=${() => window.open(`https://www.youtube.com/playlist?list=${this.impactConfig!.video_playlist_id}`, '_blank')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17"/>
              </svg>
            </button>
          </div>
          ` : ''}

          ` : html`
          <!-- ═══ NORMAL VIDEO MODE ═══ -->
          <div class="video-scroll-wrapper">
            <div class="video-scroll-row">
              ${this.videos.map(v => html`
                <div class="video-card">
                  ${this.playingMobileVideoId === v.videoId ? html`
                    <iframe
                      src="https://www.youtube.com/embed/${v.videoId}?autoplay=1"
                      allow="autoplay; encrypted-media"
                      allowfullscreen
                    ></iframe>
                  ` : html`
                    <div class="video-card-thumb ${v.isShort ? 'is-short-thumb' : ''}" @click=${() => { this.playingMobileVideoId = v.videoId; }}>
                      ${v.isShort ? html`
                        <img class="thumb-bg-blur" src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg" alt="" />
                      ` : ''}
                      <img
                        class="thumb-main"
                        src="https://i.ytimg.com/vi/${v.videoId}/maxresdefault.jpg"
                        alt="${v.title}"
                        @error=${(e: Event) => { const img = e.target as HTMLImageElement; if (img.src.includes('maxresdefault')) img.src = `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`; }}
                        @load=${(e: Event) => { const img = e.target as HTMLImageElement; if (img.src.includes('maxresdefault') && img.naturalWidth <= 120) img.src = `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`; }}
                      />
                      <div class="video-card-thumb-overlay"></div>
                      <div class="video-card-play">
                        <svg viewBox="0 0 51 42" fill="none">
                          <rect width="51" height="42" rx="10" fill="rgba(0,0,0,0.5)"/>
                          <path d="M20 12L36 21L20 30V12Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  `}
                  <p class="video-card-title">${v.title}</p>
                </div>
              `)}
            </div>
          </div>
          `}
        </div>
        ` : ''}

        <!-- Bless Section -->
        ${this.impactConfig?.blessing_published === 1 ? html`
        <div class="bless-section">
          <h3 class="bless-title">${this.impactConfig?.blessing_title || '讓善念長流 慈悲綻放'}</h3>
          <div class="bless-cards-wrapper">
            <div class="bless-cards">
              <!-- Dialog bubbles card -->
              <div class="bless-card" @click=${() => this.openBlessModal()}>
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
                  <img src="${blessing.image_url || ''}" alt="${blessing.author}" />
                  <div class="bless-photo-overlay"></div>
                  <span class="bless-photo-text">${blessing.author}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
        ` : ''}

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

    return html`
      ${this.renderContent()}
      ${this.blessModalOpen ? this.renderBlessModal() : ''}
    `;
  }

  private renderBlessModal() {
    return html`
      <dialog class="bless-modal-dialog" @click=${(e: MouseEvent) => { if (e.target === e.currentTarget) this.closeBlessModal(); }} @cancel=${() => this.closeBlessModal()}>
        <button class="bless-modal-close" @click=${() => this.closeBlessModal()}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="bless-modal-inner">
          <!-- Title + Subtitle -->
          <div class="bless-modal-header">
            <p class="bless-modal-title">${this.impactConfig?.blessing_title || '傳送希望 獻上對世界的祝福'}</p>
            <p class="bless-modal-subtitle">聽見您對世界的輕聲祝福（以下祝福語為隨機呈現）</p>
          </div>
          <!-- Dialog bubbles -->
          <div class="bless-modal-dialogs">
            ${this.blessMessages.map(msg => html`
              <div class="bless-modal-dialog-item">
                <div class="bless-modal-dialog-bubble">
                  <span>${msg}</span>
                </div>
                <div class="bless-modal-dialog-pointer">
                  <svg viewBox="0 0 12 16" fill="none">
                    <path d="M12 8L0 0V16L12 8Z" fill="white"/>
                  </svg>
                </div>
              </div>
            `)}
          </div>
          <!-- Input section -->
          <div class="bless-modal-input-section ${this.blessSubmitted ? 'submitted' : ''}">
            ${this.blessSubmitted ? html`
              <div class="bless-modal-feedback">
                <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
                  <circle cx="12" cy="12" r="10" fill="#1bb06b"/>
                  <path d="M7.5 12.5L10.5 15.5L16.5 9.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>已送出祝福！</span>
              </div>
            ` : ''}
            <div class="bless-modal-input-group">
              <div class="bless-modal-input-row">
                <input
                  class="bless-modal-input"
                  type="text"
                  placeholder="輸入祝福語"
                  .value=${this.blessInputValue}
                  @input=${(e: InputEvent) => { this.blessInputValue = (e.target as HTMLInputElement).value; }}
                  @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.submitBlessing(); }}
                />
                ${this.blessSubmitted ? html`
                  <button class="bless-modal-submit done" @click=${() => this.closeBlessModal()}>完成</button>
                ` : html`
                  <button class="bless-modal-submit" @click=${() => this.submitBlessing()}>送出</button>
                `}
              </div>
              <p class="bless-modal-disclaimer">* AI執勤中，唯有溫暖、正向語彙可通關。</p>
            </div>
          </div>
        </div>
      </dialog>
    `;
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
