import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface Session {
  id: number;
  client_session_id: string;
  sdk_session_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

@customElement('admin-chat')
export class AdminChat extends LitElement {
  @state() private messages: Message[] = [];
  @state() private inputValue = '';
  @state() private isLoading = false;
  @state() private isConnected = false;
  @state() private sessions: Session[] = [];
  @state() private showSidebar = false;
  @state() private currentSessionTitle = '';
  @state() private expandedMessages: Set<number> = new Set();
  @state() private autoRefresh = true;
  @state() private previewDevice: 'desktop' | 'tablet' | 'mobile' = 'mobile';
  @state() private showUploadModal = false;
  @state() private uploadFile: File | null = null;
  @state() private uploadPreview = '';
  @state() private uploadPurpose = '';
  @state() private uploadCategory = 'general';
  @state() private isUploading = false;

  private sessionId = '';
  private ws: WebSocket | null = null;
  private hmrWs: WebSocket | null = null;

  static styles = css`
    :host {
      display: flex;
      height: 100vh;
      background: #1a1a2e;
      color: white;
      font-family: 'Noto Sans TC', system-ui, sans-serif;
    }

    /* Sidebar Overlay */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 99;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    }

    .sidebar-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    /* Sidebar */
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: 300px;
      background: #16213e;
      border-right: 1px solid #0f3460;
      display: flex;
      flex-direction: column;
      z-index: 100;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    .sidebar.visible {
      transform: translateX(0);
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sidebar-header h2 {
      font-size: 14px;
      font-weight: 500;
      color: #888;
      margin: 0;
    }

    .close-sidebar {
      padding: 6px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 6px;
    }

    .close-sidebar:hover {
      background: #2d2d44;
      color: white;
    }

    .new-chat-btn {
      width: 100%;
      padding: 12px 16px;
      margin: 12px 16px;
      width: calc(100% - 32px);
      background: #0e2669;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .new-chat-btn:hover {
      background: #1a3a8a;
    }

    .sessions-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .session-item {
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      margin-bottom: 4px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .session-item:hover {
      background: #1a1a2e;
    }

    .session-item.active {
      background: #0e2669;
    }

    .session-icon {
      width: 32px;
      height: 32px;
      background: #2d2d44;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .session-date {
      font-size: 11px;
      color: #666;
      margin-top: 2px;
    }

    .session-delete {
      opacity: 0;
      padding: 4px;
      background: transparent;
      border: none;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
    }

    .session-item:hover .session-delete {
      opacity: 1;
    }

    .session-delete:hover {
      background: #ff4757;
      color: white;
    }

    /* Main Layout */
    .main-layout {
      display: flex;
      width: 100%;
      height: 100%;
    }

    /* Chat Panel - 30% */
    .chat-panel {
      width: 30%;
      min-width: 320px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #0f3460;
    }

    .chat-header {
      padding: 12px 16px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .menu-btn {
      padding: 8px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-btn:hover {
      background: #2d2d44;
      color: white;
    }

    .chat-header-title {
      flex: 1;
      min-width: 0;
    }

    .chat-header h1 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #888;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #666;
    }

    .status-dot.connected {
      background: #4ade80;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .message {
      max-width: 95%;
      padding: 10px 14px;
      border-radius: 12px;
      line-height: 1.5;
      font-size: 14px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
      align-self: flex-end;
      background: #0e2669;
      border-bottom-right-radius: 4px;
    }

    .message.assistant {
      align-self: flex-start;
      background: #2d2d44;
      border-bottom-left-radius: 4px;
    }

    .message.system {
      align-self: center;
      background: transparent;
      color: #666;
      font-size: 12px;
      padding: 6px;
    }

    /* Collapsible */
    .message-wrapper {
      display: flex;
      flex-direction: column;
      max-width: 95%;
      align-self: flex-start;
    }

    .message-wrapper .message {
      max-width: none;
    }

    .message-content.collapsed {
      max-height: 200px;
      overflow: hidden;
      position: relative;
    }

    .message-content.collapsed::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: linear-gradient(transparent, #2d2d44);
    }

    .toggle-btn {
      align-self: flex-start;
      margin-top: 6px;
      padding: 4px 10px;
      background: rgba(74, 222, 128, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.3);
      border-radius: 12px;
      color: #4ade80;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toggle-btn:hover {
      background: rgba(74, 222, 128, 0.25);
    }

    .toggle-btn svg {
      width: 12px;
      height: 12px;
      transition: transform 0.2s;
    }

    .toggle-btn.expanded svg {
      transform: rotate(180deg);
    }

    /* Message formatting */
    .message pre {
      background: #1a1a2e;
      padding: 10px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
      margin: 8px 0;
    }

    .message code {
      font-family: 'SF Mono', monospace;
      background: rgba(255,255,255,0.1);
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    .message pre code {
      background: transparent;
      padding: 0;
    }

    .message table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 12px;
    }

    .message th, .message td {
      padding: 6px 8px;
      text-align: left;
      border-bottom: 1px solid #3d3d5c;
    }

    .message th {
      background: #2d2d44;
      color: #4ade80;
      font-size: 11px;
    }

    .message ul, .message ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    .message li { margin: 4px 0; }

    .message h2, .message h3, .message h4 {
      margin: 12px 0 6px 0;
      color: #fff;
    }

    .message h3 { font-size: 14px; color: #4ade80; }

    .message blockquote {
      margin: 8px 0;
      padding: 8px 12px;
      border-left: 3px solid #4ade80;
      background: rgba(74, 222, 128, 0.1);
      border-radius: 0 6px 6px 0;
      font-size: 13px;
    }

    .message hr {
      border: none;
      border-top: 1px solid #3d3d5c;
      margin: 12px 0;
    }

    .message strong { color: #fff; }

    .thinking {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
    }

    .thinking span {
      width: 6px;
      height: 6px;
      background: #666;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .thinking span:nth-child(1) { animation-delay: -0.32s; }
    .thinking span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .input-area {
      padding: 12px 16px;
      background: #16213e;
      border-top: 1px solid #0f3460;
    }

    .input-container {
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    textarea {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #0f3460;
      border-radius: 10px;
      background: #1a1a2e;
      color: white;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      min-height: 40px;
      max-height: 100px;
    }

    textarea:focus {
      outline: none;
      border-color: #0e2669;
    }

    textarea::placeholder {
      color: #666;
    }

    button.send {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #0e2669;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    button.send:hover:not(:disabled) {
      background: #1a3a8a;
    }

    button.send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.send svg {
      width: 18px;
      height: 18px;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }

    .suggestion {
      padding: 6px 12px;
      background: #2d2d44;
      border: 1px solid #0f3460;
      border-radius: 16px;
      color: #ccc;
      font-size: 12px;
      cursor: pointer;
    }

    .suggestion:hover {
      background: #0e2669;
      color: white;
    }

    /* Preview Panel - 70% */
    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #0d0d1a;
    }

    .preview-header {
      padding: 12px 16px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-header h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #4ade80;
    }

    .refresh-btn {
      padding: 6px 12px;
      background: transparent;
      border: 1px solid #3d3d5c;
      border-radius: 6px;
      color: #888;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .refresh-btn:hover {
      border-color: #4ade80;
      color: #4ade80;
    }

    .refresh-btn.auto-on {
      border-color: #4ade80;
      color: #4ade80;
    }

    .preview-content {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }

    /* Upload Button */
    .upload-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid #3d3d5c;
      color: #888;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .upload-btn:hover {
      border-color: #4ade80;
      color: #4ade80;
    }

    .upload-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Upload Modal */
    .upload-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
    }

    .upload-modal-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    .upload-modal {
      background: #1a1a2e;
      border: 1px solid #3d3d5c;
      border-radius: 16px;
      width: 90%;
      max-width: 450px;
      padding: 24px;
      transform: scale(0.9);
      transition: transform 0.3s;
    }

    .upload-modal-overlay.visible .upload-modal {
      transform: scale(1);
    }

    .upload-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .upload-modal-header h3 {
      margin: 0;
      font-size: 16px;
      color: #4ade80;
    }

    .upload-modal-close {
      padding: 6px;
      background: transparent;
      border: none;
      color: #888;
      cursor: pointer;
      border-radius: 6px;
    }

    .upload-modal-close:hover {
      background: #2d2d44;
      color: white;
    }

    .upload-dropzone {
      border: 2px dashed #3d3d5c;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 16px;
    }

    .upload-dropzone:hover {
      border-color: #4ade80;
      background: rgba(74, 222, 128, 0.05);
    }

    .upload-dropzone.has-file {
      border-color: #4ade80;
      padding: 16px;
    }

    .upload-dropzone-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }

    .upload-dropzone-text {
      color: #888;
      font-size: 14px;
    }

    .upload-dropzone-hint {
      color: #666;
      font-size: 12px;
      margin-top: 8px;
    }

    .upload-preview-img {
      max-width: 100%;
      max-height: 200px;
      border-radius: 8px;
      object-fit: contain;
    }

    .upload-preview-name {
      font-size: 12px;
      color: #888;
      margin-top: 8px;
      word-break: break-all;
    }

    .upload-purpose-label {
      display: block;
      font-size: 13px;
      color: #888;
      margin-bottom: 8px;
    }

    .upload-category-select {
      width: 100%;
      padding: 12px;
      border: 1px solid #3d3d5c;
      border-radius: 8px;
      background: #16213e;
      color: white;
      font-size: 14px;
      font-family: inherit;
      margin-bottom: 16px;
      cursor: pointer;
    }

    .upload-category-select:focus {
      outline: none;
      border-color: #4ade80;
    }

    .upload-category-select option {
      background: #16213e;
      color: white;
    }

    .upload-purpose-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #3d3d5c;
      border-radius: 8px;
      background: #16213e;
      color: white;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      margin-bottom: 16px;
    }

    .upload-purpose-input:focus {
      outline: none;
      border-color: #4ade80;
    }

    .upload-purpose-input::placeholder {
      color: #666;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .upload-cancel-btn {
      padding: 10px 20px;
      border: 1px solid #3d3d5c;
      border-radius: 8px;
      background: transparent;
      color: #888;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-cancel-btn:hover {
      border-color: #666;
      color: white;
    }

    .upload-submit-btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: #0e2669;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .upload-submit-btn:hover:not(:disabled) {
      background: #1a3a8a;
    }

    .upload-submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Device Toggle */
    .device-toggle {
      display: flex;
      gap: 4px;
      background: #1a1a2e;
      border-radius: 8px;
      padding: 4px;
    }

    .device-btn {
      padding: 6px 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #666;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .device-btn:hover {
      color: #888;
    }

    .device-btn.active {
      background: #0e2669;
      color: white;
    }

    .device-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Preview Frame Container */
    .preview-frame-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a14;
      border-radius: 8px;
      overflow: hidden;
    }

    .preview-frame-wrapper {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }

    .preview-frame-wrapper.desktop {
      width: 100%;
      height: 100%;
      border-radius: 0;
    }

    .preview-frame-wrapper.tablet {
      width: 768px;
      height: 1024px;
      max-width: 100%;
      max-height: 100%;
    }

    .preview-frame-wrapper.mobile {
      width: 390px;
      height: 844px;
      max-width: 100%;
      max-height: 100%;
      border-radius: 24px;
      border: 8px solid #1a1a2e;
    }

    .preview-frame-wrapper iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadSessions();
    this.startNewSession();
    this.connectWebSocket();
    this.connectHmrWebSocket();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ws?.close();
    this.hmrWs?.close();
  }

  private connectHmrWebSocket() {
    // 連接 Vite 的 HMR WebSocket
    try {
      this.hmrWs = new WebSocket('ws://localhost:5173/', 'vite-hmr');

      this.hmrWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // 當收到 update 或 full-reload 事件時，重新整理 iframe
          if (this.autoRefresh && (data.type === 'update' || data.type === 'full-reload')) {
            this.refreshPreview();
          }
        } catch {
          // 忽略非 JSON 訊息
        }
      };

      this.hmrWs.onclose = () => {
        // 斷線後嘗試重連
        setTimeout(() => this.connectHmrWebSocket(), 3000);
      };
    } catch (e) {
      console.error('HMR WebSocket connection failed:', e);
    }
  }

  private refreshPreview() {
    const iframe = this.shadowRoot?.querySelector('.preview-content iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src; // 重新載入 iframe
    }
  }

  private async loadSessions() {
    try {
      const res = await fetch('http://localhost:8000/api/agent/sessions');
      const data = await res.json();
      this.sessions = data.sessions || [];
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }

  private startNewSession() {
    this.sessionId = crypto.randomUUID();
    this.messages = [];
    this.currentSessionTitle = '';
    this.expandedMessages = new Set();
    this.showSidebar = false;
    this.addSystemMessage('歡迎使用 AI 管理助手！');
  }

  private async loadSession(session: Session) {
    this.sessionId = session.client_session_id;
    this.currentSessionTitle = session.title || '未命名對話';
    this.messages = [];
    this.expandedMessages = new Set();
    this.isLoading = true;
    this.showSidebar = false;

    try {
      const res = await fetch(`http://localhost:8000/api/agent/session/${session.client_session_id}/history`);
      const data = await res.json();

      if (data.messages?.length > 0) {
        for (const msg of data.messages) {
          this.messages = [...this.messages, {
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }];
        }
        this.scrollToBottom();
      } else {
        this.addSystemMessage(`已載入：${this.currentSessionTitle}`);
      }
    } catch (e) {
      console.error('Failed to load session history:', e);
      this.addSystemMessage(`已載入：${this.currentSessionTitle}`);
    } finally {
      this.isLoading = false;
    }
  }

  private async deleteSession(session: Session, e: Event) {
    e.stopPropagation();
    if (!confirm(`確定要刪除「${session.title || '未命名對話'}」嗎？`)) return;

    try {
      await fetch(`http://localhost:8000/api/agent/session/${session.client_session_id}`, {
        method: 'DELETE',
      });
      this.sessions = this.sessions.filter(s => s.id !== session.id);
      if (this.sessionId === session.client_session_id) {
        this.startNewSession();
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  }

  private connectWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:8000/api/agent/ws');

      this.ws.onopen = () => { this.isConnected = true; };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'thinking') {
          this.isLoading = true;
        } else if (data.type === 'response') {
          this.isLoading = false;
          this.addMessage('assistant', data.message);
          this.loadSessions();
        } else if (data.type === 'error') {
          this.isLoading = false;
          this.addMessage('system', `錯誤: ${data.message}`);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = () => { this.isConnected = false; };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string) {
    this.messages = [...this.messages, { role, content, timestamp: new Date() }];
    this.scrollToBottom();
  }

  private addSystemMessage(content: string) {
    this.addMessage('system', content);
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      const el = this.shadowRoot?.querySelector('.messages');
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  private async sendMessage() {
    const message = this.inputValue.trim();
    if (!message || this.isLoading) return;

    this.inputValue = '';
    this.addMessage('user', message);

    if (!this.currentSessionTitle) {
      this.currentSessionTitle = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ sessionId: this.sessionId, message }));
    } else {
      this.isLoading = true;
      try {
        const res = await fetch('http://localhost:8000/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, message }),
        });
        const data = await res.json();
        if (data.success) {
          this.addMessage('assistant', data.message);
          this.loadSessions();
        } else {
          this.addMessage('system', `錯誤: ${data.error}`);
        }
      } catch {
        this.addMessage('system', '連接失敗');
      } finally {
        this.isLoading = false;
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  private handleSuggestion(text: string) {
    this.inputValue = text;
    this.sendMessage();
  }

  private toggleMessage(index: number) {
    const newSet = new Set(this.expandedMessages);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    this.expandedMessages = newSet;
  }

  private formatMessage(content: string): string {
    const lines = content.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        let t = '<table>';
        tableRows.forEach((row, i) => {
          if (i === 0) {
            t += '<thead><tr>' + row.map(c => `<th>${this.formatInline(c)}</th>`).join('') + '</tr></thead><tbody>';
          } else if (!row.every(c => /^[-:|]+$/.test(c))) {
            t += '<tr>' + row.map(c => `<td>${this.formatInline(c)}</td>`).join('') + '</tr>';
          }
        });
        t += '</tbody></table>';
        result.push(t);
        tableRows = [];
      }
      inTable = false;
    };

    const flushList = () => {
      if (listItems.length > 0) {
        result.push('<ul>' + listItems.map(i => `<li>${this.formatInline(i)}</li>`).join('') + '</ul>');
        listItems = [];
      }
      inList = false;
    };

    for (const line of lines) {
      if (line.startsWith('|') && line.endsWith('|')) {
        if (inList) flushList();
        inTable = true;
        tableRows.push(line.slice(1, -1).split('|').map(c => c.trim()));
        continue;
      } else if (inTable) flushTable();

      if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        if (inTable) flushTable();
        inList = true;
        listItems.push(line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));
        continue;
      } else if (inList) flushList();

      if (line.startsWith('### ')) result.push(`<h3>${this.formatInline(line.slice(4))}</h3>`);
      else if (line.startsWith('## ')) result.push(`<h2>${this.formatInline(line.slice(3))}</h2>`);
      else if (line.startsWith('> ')) result.push(`<blockquote>${this.formatInline(line.slice(2))}</blockquote>`);
      else if (/^---+$/.test(line)) result.push('<hr>');
      else if (line.trim() === '') result.push('<br>');
      else result.push(this.formatInline(line));
    }

    if (inTable) flushTable();
    if (inList) flushList();
    return result.join('\n');
  }

  private formatInline(text: string): string {
    return text
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-TW');
  }

  private openUploadModal() {
    this.showUploadModal = true;
    this.uploadFile = null;
    this.uploadPreview = '';
    this.uploadPurpose = '';
    this.uploadCategory = 'general';
  }

  private closeUploadModal() {
    this.showUploadModal = false;
    this.uploadFile = null;
    this.uploadPreview = '';
    this.uploadPurpose = '';
    this.uploadCategory = 'general';
  }

  private handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.setUploadFile(file);
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.setUploadFile(file);
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  private setUploadFile(file: File) {
    this.uploadFile = file;
    // 生成預覽
    const reader = new FileReader();
    reader.onload = () => {
      this.uploadPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  private async handleUpload() {
    if (!this.uploadFile || this.isUploading) return;

    this.isUploading = true;
    try {
      const formData = new FormData();
      formData.append('file', this.uploadFile);
      formData.append('category', this.uploadCategory);

      const res = await fetch('http://localhost:8000/api/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      const imageUrl = `http://localhost:8000/uploads/gallery/${data.filename}`;
      const purpose = this.uploadPurpose.trim();
      const categoryLabel = this.uploadCategory === 'homepage' ? '首頁 60 Grid' :
                           this.uploadCategory === 'events' ? '活動封面' :
                           this.uploadCategory === 'topics' ? '主題背景' :
                           this.uploadCategory === 'blessings' ? '祝福語' : '一般';

      // 關閉彈窗
      this.closeUploadModal();

      // 組合訊息告知 AI
      const message = purpose
        ? `我上傳了一張圖片，用途是：${purpose}\n\n圖片資訊：\n- ID: ${data.id}\n- 檔名: ${data.filename}\n- 分類: ${categoryLabel}\n- 網址: ${imageUrl}`
        : `我上傳了一張圖片到圖片庫。\n\n圖片資訊：\n- ID: ${data.id}\n- 檔名: ${data.filename}\n- 分類: ${categoryLabel}\n- 網址: ${imageUrl}`;

      // 發送訊息給 AI
      this.inputValue = message;
      await this.sendMessage();

    } catch (error) {
      console.error('Upload error:', error);
      this.addMessage('system', '圖片上傳失敗，請重試');
    } finally {
      this.isUploading = false;
    }
  }

  render() {
    const icons = {
      send: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>`,
      menu: html`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
      plus: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
      trash: html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
      chevron: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`,
      close: html`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`,
      upload: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>`,
      desktop: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
      tablet: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>`,
      mobile: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>`,
    };

    const suggestions = ['顯示所有主題', '查詢活動', '更新首頁'];

    return html`
      <!-- Sidebar Overlay -->
      <div class="sidebar-overlay ${this.showSidebar ? 'visible' : ''}"
           @click=${() => this.showSidebar = false}></div>

      <!-- Sidebar -->
      <aside class="sidebar ${this.showSidebar ? 'visible' : ''}">
        <div class="sidebar-header">
          <h2>對話紀錄</h2>
          <button class="close-sidebar" @click=${() => this.showSidebar = false}>${icons.close}</button>
        </div>
        <button class="new-chat-btn" @click=${() => this.startNewSession()}>
          ${icons.plus} 新對話
        </button>
        <div class="sessions-list">
          ${this.sessions.map(s => html`
            <div class="session-item ${s.client_session_id === this.sessionId ? 'active' : ''}"
                 @click=${() => this.loadSession(s)}>
              <div class="session-icon">💬</div>
              <div class="session-info">
                <div class="session-title">${s.title || '未命名'}</div>
                <div class="session-date">${this.formatDate(s.created_at)}</div>
              </div>
              <button class="session-delete" @click=${(e: Event) => this.deleteSession(s, e)}>${icons.trash}</button>
            </div>
          `)}
          ${this.sessions.length === 0 ? html`<div style="padding:20px;text-align:center;color:#666;font-size:13px;">尚無紀錄</div>` : ''}
        </div>
      </aside>

      <!-- Main Layout -->
      <div class="main-layout">
        <!-- Chat Panel 30% -->
        <div class="chat-panel">
          <div class="chat-header">
            <button class="menu-btn" @click=${() => this.showSidebar = true}>${icons.menu}</button>
            <div class="chat-header-title">
              <h1>${this.currentSessionTitle || 'AI 管理助手'}</h1>
            </div>
            <div class="status">
              <span class="status-dot ${this.isConnected ? 'connected' : ''}"></span>
              ${this.isConnected ? '已連接' : '...'}
            </div>
          </div>

          <div class="messages">
            ${this.messages.map((msg, i) => {
              const isLong = msg.content.length > 400 || msg.content.split('\n').length > 12;
              const isExpanded = this.expandedMessages.has(i);

              if (msg.role === 'system') return html`<div class="message system">${msg.content}</div>`;
              if (msg.role === 'user' || !isLong) return html`<div class="message ${msg.role}" .innerHTML=${this.formatMessage(msg.content)}></div>`;

              return html`
                <div class="message-wrapper">
                  <div class="message assistant message-content ${isExpanded ? '' : 'collapsed'}" .innerHTML=${this.formatMessage(msg.content)}></div>
                  <button class="toggle-btn ${isExpanded ? 'expanded' : ''}" @click=${() => this.toggleMessage(i)}>
                    ${isExpanded ? '收起' : '更多'} ${icons.chevron}
                  </button>
                </div>
              `;
            })}
            ${this.isLoading ? html`<div class="message assistant thinking"><span></span><span></span><span></span></div>` : ''}
          </div>

          <div class="input-area">
            <div class="input-container">
              <button class="upload-btn" @click=${this.openUploadModal} title="上傳圖片">
                ${icons.upload}
              </button>
              <textarea
                placeholder="輸入訊息..."
                .value=${this.inputValue}
                @input=${(e: Event) => this.inputValue = (e.target as HTMLTextAreaElement).value}
                @keydown=${this.handleKeyDown}
                ?disabled=${this.isLoading}
                rows="1"
              ></textarea>
              <button class="send" @click=${this.sendMessage} ?disabled=${this.isLoading || !this.inputValue.trim()}>
                ${icons.send}
              </button>
            </div>
            ${this.messages.length <= 1 ? html`
              <div class="suggestions">
                ${suggestions.map(s => html`<button class="suggestion" @click=${() => this.handleSuggestion(s)}>${s}</button>`)}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Preview Panel 70% -->
        <div class="preview-panel">
          <div class="preview-header">
            <h2>網站預覽</h2>
            <div style="display: flex; gap: 12px; align-items: center;">
              <div class="device-toggle">
                <button class="device-btn ${this.previewDevice === 'desktop' ? 'active' : ''}"
                        @click=${() => this.previewDevice = 'desktop'}
                        title="電腦">
                  ${icons.desktop}
                </button>
                <button class="device-btn ${this.previewDevice === 'tablet' ? 'active' : ''}"
                        @click=${() => this.previewDevice = 'tablet'}
                        title="平板">
                  ${icons.tablet}
                </button>
                <button class="device-btn ${this.previewDevice === 'mobile' ? 'active' : ''}"
                        @click=${() => this.previewDevice = 'mobile'}
                        title="手機">
                  ${icons.mobile}
                </button>
              </div>
              <button class="refresh-btn ${this.autoRefresh ? 'auto-on' : ''}"
                      @click=${() => this.autoRefresh = !this.autoRefresh}>
                ${this.autoRefresh ? '🟢 自動更新' : '⚪ 自動更新'}
              </button>
              <button class="refresh-btn" @click=${this.refreshPreview}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                重新整理
              </button>
            </div>
          </div>
          <div class="preview-content">
            <div class="preview-frame-container">
              <div class="preview-frame-wrapper ${this.previewDevice}">
                <iframe src="http://localhost:5173/"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="upload-modal-overlay ${this.showUploadModal ? 'visible' : ''}"
           @click=${(e: Event) => e.target === e.currentTarget && this.closeUploadModal()}>
        <div class="upload-modal">
          <div class="upload-modal-header">
            <h3>上傳圖片</h3>
            <button class="upload-modal-close" @click=${this.closeUploadModal}>${icons.close}</button>
          </div>

          <div class="upload-dropzone ${this.uploadFile ? 'has-file' : ''}"
               @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('#fileInput')?.click()}
               @drop=${this.handleDrop}
               @dragover=${this.handleDragOver}>
            ${this.uploadPreview ? html`
              <img class="upload-preview-img" src="${this.uploadPreview}" alt="預覽" />
              <div class="upload-preview-name">${this.uploadFile?.name}</div>
            ` : html`
              <div class="upload-dropzone-icon">📷</div>
              <div class="upload-dropzone-text">點擊或拖放圖片到此處</div>
              <div class="upload-dropzone-hint">支援 JPG、PNG、WebP、GIF</div>
            `}
          </div>
          <input type="file" id="fileInput" accept="image/*" style="display:none" @change=${this.handleFileSelect} />

          <label class="upload-purpose-label">圖片分類</label>
          <select class="upload-category-select"
                  .value=${this.uploadCategory}
                  @change=${(e: Event) => this.uploadCategory = (e.target as HTMLSelectElement).value}>
            <option value="homepage">首頁 60 Grid</option>
            <option value="events">活動封面</option>
            <option value="topics">主題背景</option>
            <option value="blessings">祝福語</option>
            <option value="general">一般圖片</option>
          </select>

          <label class="upload-purpose-label">用途說明（可選）</label>
          <textarea
            class="upload-purpose-input"
            placeholder="例如：這是首頁的背景圖、這是活動「線上浴佛」的封面圖..."
            rows="2"
            .value=${this.uploadPurpose}
            @input=${(e: Event) => this.uploadPurpose = (e.target as HTMLTextAreaElement).value}
          ></textarea>

          <div class="upload-actions">
            <button class="upload-cancel-btn" @click=${this.closeUploadModal}>取消</button>
            <button class="upload-submit-btn"
                    @click=${this.handleUpload}
                    ?disabled=${!this.uploadFile || this.isUploading}>
              ${this.isUploading ? '上傳中...' : '上傳並告知 AI'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-chat': AdminChat;
  }
}
