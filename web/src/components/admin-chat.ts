import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

@customElement('admin-chat')
export class AdminChat extends LitElement {
  @state()
  private messages: Message[] = [];

  @state()
  private inputValue = '';

  @state()
  private isLoading = false;

  @state()
  private isConnected = false;

  private sessionId = crypto.randomUUID();
  private ws: WebSocket | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #1a1a2e;
      color: white;
      font-family: 'Noto Sans TC', system-ui, sans-serif;
    }

    .header {
      padding: 16px 20px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #888;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #666;
    }

    .status-dot.connected {
      background: #4ade80;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      line-height: 1.5;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      color: #888;
      font-size: 13px;
      padding: 8px;
    }

    .message pre {
      background: #1a1a2e;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      margin: 8px 0;
    }

    .message code {
      font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .thinking {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }

    .thinking span {
      width: 8px;
      height: 8px;
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
      padding: 16px 20px;
      background: #16213e;
      border-top: 1px solid #0f3460;
    }

    .input-container {
      display: flex;
      gap: 12px;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    textarea {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #0f3460;
      border-radius: 12px;
      background: #1a1a2e;
      color: white;
      font-size: 15px;
      font-family: inherit;
      resize: none;
      min-height: 44px;
      max-height: 120px;
      box-sizing: border-box;
    }

    textarea:focus {
      outline: none;
      border-color: #0e2669;
    }

    textarea::placeholder {
      color: #666;
    }

    button.send {
      width: 44px;
      height: 44px;
      border-radius: 12px;
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
      transform: scale(1.05);
    }

    button.send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.send svg {
      width: 20px;
      height: 20px;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .suggestion {
      padding: 8px 14px;
      background: #2d2d44;
      border: 1px solid #0f3460;
      border-radius: 20px;
      color: #ccc;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .suggestion:hover {
      background: #0e2669;
      border-color: #0e2669;
      color: white;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.connectWebSocket();
    this.addSystemMessage('歡迎使用 AI 管理助手！你可以用自然語言來管理網站內容。');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.ws?.close();
  }

  private connectWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:8001/ws');

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'thinking') {
          this.isLoading = true;
        } else if (data.type === 'response') {
          this.isLoading = false;
          this.addMessage('assistant', data.message);
        } else if (data.type === 'error') {
          this.isLoading = false;
          this.addMessage('system', `錯誤: ${data.message}`);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string) {
    this.messages = [...this.messages, {
      role,
      content,
      timestamp: new Date(),
    }];
    this.scrollToBottom();
  }

  private addSystemMessage(content: string) {
    this.addMessage('system', content);
  }

  private scrollToBottom() {
    requestAnimationFrame(() => {
      const messagesEl = this.shadowRoot?.querySelector('.messages');
      if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
  }

  private async sendMessage() {
    const message = this.inputValue.trim();
    if (!message || this.isLoading) return;

    this.inputValue = '';
    this.addMessage('user', message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        sessionId: this.sessionId,
        message,
      }));
    } else {
      // Fallback to HTTP
      this.isLoading = true;
      try {
        const res = await fetch('http://localhost:8001/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            message,
          }),
        });
        const data = await res.json();
        if (data.success) {
          this.addMessage('assistant', data.message);
        } else {
          this.addMessage('system', `錯誤: ${data.error}`);
        }
      } catch (e) {
        this.addMessage('system', '連接失敗，請稍後再試');
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

  private formatMessage(content: string): string {
    // Simple markdown-like formatting
    return content
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  render() {
    const sendIcon = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
      </svg>
    `;

    const suggestions = [
      '顯示所有主題',
      '查詢 8 月的活動',
      '更新首頁標語',
      '顯示圖片庫',
    ];

    return html`
      <div class="header">
        <h1>🤖 AI 管理助手</h1>
        <div class="status">
          <span class="status-dot ${this.isConnected ? 'connected' : ''}"></span>
          ${this.isConnected ? '已連接' : '連接中...'}
        </div>
      </div>

      <div class="messages">
        ${this.messages.map(msg => html`
          <div class="message ${msg.role}" .innerHTML=${this.formatMessage(msg.content)}></div>
        `)}
        ${this.isLoading ? html`
          <div class="message assistant thinking">
            <span></span><span></span><span></span>
          </div>
        ` : ''}
      </div>

      <div class="input-area">
        <div class="input-container">
          <div class="input-wrapper">
            <textarea
              placeholder="輸入訊息... (Enter 發送，Shift+Enter 換行)"
              .value=${this.inputValue}
              @input=${(e: Event) => this.inputValue = (e.target as HTMLTextAreaElement).value}
              @keydown=${this.handleKeyDown}
              ?disabled=${this.isLoading}
              rows="1"
            ></textarea>
          </div>
          <button
            class="send"
            @click=${this.sendMessage}
            ?disabled=${this.isLoading || !this.inputValue.trim()}
          >
            ${sendIcon}
          </button>
        </div>

        ${this.messages.length <= 1 ? html`
          <div class="suggestions">
            ${suggestions.map(s => html`
              <button class="suggestion" @click=${() => this.handleSuggestion(s)}>
                ${s}
              </button>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'admin-chat': AdminChat;
  }
}
