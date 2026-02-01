# 技術棧說明文件

本文件詳細說明專案的技術架構，供後續開發或 AI 助手參考。

---

## 總覽

| 層級 | 技術 | 版本 |
|------|------|------|
| Frontend | Lit Web Components | ^3.2.0 |
| State Management | @lit/context | ^1.1.0 |
| Build Tool | Vite (via Deno) | - |
| Backend Runtime | Deno | latest |
| Backend Framework | Hono | ^4.6.0 |
| Database | PostgreSQL | 18 |
| Reverse Proxy | Nginx | alpine |

---

## 前端 (web/)

### 核心依賴

```json
{
  "lit": "^3.2.0",
  "@lit/context": "^1.1.0",
  "@codesandbox/sandpack-client": "^2.19.0"
}
```

### Lit 使用方式

使用 Lit 3 的裝飾器語法：

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { provide, consume } from '@lit/context';

@customElement('my-component')
export class MyComponent extends LitElement {
  @property({ type: String }) name = '';
  @state() private count = 0;

  static styles = css`...`;

  render() {
    return html`...`;
  }
}
```

### TypeScript 設定

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "lib": ["ES2021", "DOM", "DOM.Iterable"]
  }
}
```

**重要**: `useDefineForClassFields: false` 是 Lit 裝飾器正常運作的必要設定。

### 狀態管理架構

使用 `@lit/context` + 自訂 Store 模式：

```
web/src/
├── contexts/
│   ├── app-context.ts    # createContext() 定義
│   └── data-context.ts
├── stores/
│   ├── app-store.ts      # UI 狀態 (singleton)
│   └── data-store.ts     # API 資料 (singleton)
```

#### AppStore (UI 狀態)

```typescript
// 管理的狀態
interface AppState {
  sheetState: 'peek' | 'preview' | 'full';  // 底部 sheet 位置
  activeTab: 'topics' | 'schedule' | 'impact';
  currentPage: 'category' | 'detail' | 'month' | 'blessing' | null;
  selectedMonth: number;
  selectedYear: number;
  currentCategoryId: number | null;
  currentNewsId: number | null;
  currentBlessingId: number | null;
}
```

#### DataStore (API 資料)

```typescript
interface DataState {
  topics: Topic[];
  impactSections: ImpactSection[];
  events: Event[];
  blessings: Blessing[];
  loading: boolean;
  error: string | null;
}
```

### Context 注入方式

```typescript
// 在 app-root.ts 提供 context
@customElement('app-root')
export class AppRoot extends LitElement {
  @provide({ context: appContext })
  appStore: AppStore = appStore;

  @provide({ context: dataContext })
  dataStore: DataStore = dataStore;
}

// 在子組件消費 context
@customElement('child-component')
export class ChildComponent extends LitElement {
  @consume({ context: appContext, subscribe: true })
  appStore!: AppStore;
}
```

### 組件結構

```
web/src/components/
├── app-root.ts           # 根組件，提供 context
├── app-shell.ts          # 判斷 mobile/desktop 模式
├── app-sheet.ts          # Mobile 底部拖曳 sheet
├── app-homepage.ts       # Mobile 首頁
├── app-poster.ts         # 海報展示
│
├── desktop-layout.ts     # Desktop 主佈局
├── desktop-header.ts     # 百工圖 (6+0 digit grid)
├── desktop-intro.ts      # 介紹區塊
├── desktop-topics.ts     # 看主題 + 活動卡片輪播
├── desktop-schedule.ts   # 看時程 (月份選擇)
├── desktop-impact.ts     # 看影響 + 祝福標籤
├── desktop-blessings.ts  # 內部期許卡片輪播
│
├── topic-page.ts         # 主題詳情頁
├── blessing-page.ts      # 祝福詳情 (Mobile: 全頁, Desktop: Modal)
├── sheet-content.ts      # Sheet 內容區域
├── homepage-tabs.ts      # 首頁分頁
└── homepage-grid.ts      # 首頁圖片網格
```

### 響應式設計

- Mobile: `max-width: 767px`，限制寬度 430px
- Desktop: `min-width: 768px`

```typescript
// app-shell.ts 判斷邏輯
@state() private isDesktop = window.innerWidth >= 768;

connectedCallback() {
  window.addEventListener('resize', this.handleResize);
}

render() {
  return this.isDesktop
    ? html`<desktop-layout></desktop-layout>`
    : html`<app-homepage></app-homepage>`;
}
```

---

## 後端 (api/)

### 核心依賴

```typescript
import { Hono } from "jsr:@hono/hono@^4.6.0";
import { cors } from "jsr:@hono/hono@^4.6.0/cors";
import { serveStatic } from "jsr:@hono/hono@^4.6.0/deno";
import { bodyLimit } from "jsr:@hono/hono@^4.6.0/body-limit";
import postgres from "https://deno.land/x/postgres@v0.19.3/mod.ts";
```

### 路由結構

```
api/routes/
├── topics.ts         # /api/topics
├── events.ts         # /api/events
├── impact.ts         # /api/impact
├── blessings.ts      # /api/blessings
├── blessing-tags.ts  # /api/blessing-tags
├── gallery.ts        # /api/gallery
├── homepage.ts       # /api/homepage
└── agent.ts          # /api/agent (AI Agent)
```

### API 端點一覽

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/topics` | 取得所有主題 |
| GET | `/api/topics/:id` | 取得單一主題 (含活動) |
| GET | `/api/events?month=&year=&topic_id=` | 查詢活動 |
| GET | `/api/events/:id` | 取得單一活動 |
| GET | `/api/impact` | 取得影響力區塊 |
| GET | `/api/blessings?featured=true` | 取得祝福語 |
| GET | `/api/blessings/:id` | 取得單一祝福 |
| GET | `/api/blessing-tags` | 取得祝福標籤 |
| GET | `/api/gallery/random?count=15&category=` | 隨機圖片 |
| GET | `/api/gallery?category=` | 所有圖片 |
| POST | `/api/gallery` | 上傳圖片 (multipart) |
| PUT | `/api/gallery/:id` | 更新圖片分類 |
| DELETE | `/api/gallery/:id` | 刪除圖片 |
| GET | `/api/homepage` | 取得首頁內容 |
| PUT | `/api/homepage` | 更新首頁內容 |
| GET | `/uploads/gallery/*` | 靜態圖片服務 |

### Hono 路由範例

```typescript
import { Hono } from "hono";
import { pool } from "../db.ts";

export const topicsRoutes = new Hono();

topicsRoutes.get("/", async (c) => {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<Topic>(
      "SELECT * FROM topics ORDER BY sort_order"
    );
    return c.json(result.rows);
  } finally {
    client.release();
  }
});
```

### 資料庫連線 (db.ts)

```typescript
import { Pool } from "postgres";

export const pool = new Pool({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: 5432,
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "postgres",
  database: Deno.env.get("DB_NAME") || "events_app",
}, 10);
```

### 檔案上傳

Gallery 上傳限制 100MB：

```typescript
const galleryBodyLimit = bodyLimit({
  maxSize: 100 * 1024 * 1024,
  onError: (c) => c.json({ error: "檔案大小超過 100MB 限制" }, 413)
});
```

---

## 資料庫

### 資料表結構

| Table | 說明 | 主要欄位 |
|-------|------|----------|
| `topics` | 主題 | id, name, subtitle, description, icon, background_image, sort_order |
| `events` | 活動 | id, title, description, date_start, date_end, participation_type, image_url, link_url, topic_id, month, year, sort_order |
| `impact_sections` | 影響力 | id, name, icon, stat_value, stat_label, sort_order |
| `blessings` | 祝福語 | id, author, message, full_content, image_url, sort_order |
| `blessing_tags` | 祝福標籤 | id, message, is_active |
| `gallery` | 圖庫 | id, filename, original_name, mime_type, category, uploaded_at, is_active |
| `homepage` | 首頁 | id, slogan, title, content, updated_at |
| `agent_sessions` | AI Agent | id, client_session_id, sdk_session_id, title, created_at |

### 圖片分類

| Category | 用途 |
|----------|------|
| `homepage` | 首頁 60 Grid 圓形圖片 |
| `events` | 活動封面圖 |
| `topics` | 主題背景圖 |
| `blessings` | 祝福語配圖 |
| `general` | 一般圖片 |

---

## 前端 API 服務

`web/src/services/api.ts` 封裝所有 API 呼叫：

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async getTopics(): Promise<Topic[]> { ... },
  async getEvents(params?: { month?, year?, topic_id? }): Promise<Event[]> { ... },
  async getBlessings(featured?: boolean): Promise<Blessing[]> { ... },
  async getGalleryRandom(count: number, category?: string): Promise<GalleryImage[]> { ... },
  // ...
};
```

### 型別定義

```typescript
export interface Topic {
  id: number;
  name: string;
  subtitle: string | null;
  description: string | null;
  icon: string;
  background_image: string | null;
  sort_order: number;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  date_start: string;
  date_end: string | null;
  participation_type: string | null;
  image_url: string | null;
  link_url: string | null;
  topic_id: number | null;
  month: number;
  year: number;
  sort_order: number;
}

export interface Blessing {
  id: number;
  author: string;
  message: string;
  full_content: string | null;
  image_url: string | null;
  sort_order: number;
}
```

---

## Docker 部署

### 服務架構

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  nginx  │────▶│   api   │────▶│   db    │
│  :8973  │     │  :8000  │     │  :5432  │
└─────────┘     └─────────┘     └─────────┘
     │
     ▼
┌─────────┐
│   web   │ (static files)
└─────────┘
```

### 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `ADMIN_USER` | admin | 後台帳號 |
| `ADMIN_PASSWORD` | changeme | 後台密碼 |
| `DB_USER` | postgres | 資料庫帳號 |
| `DB_PASSWORD` | postgres | 資料庫密碼 |
| `DB_NAME` | events_app | 資料庫名稱 |
| `DB_HOST` | db | 資料庫主機 |
| `PORT` | 8973 | 對外 Port |

---

## 開發注意事項

### Lit 相關

1. **裝飾器**: 必須設定 `experimentalDecorators: true`
2. **Class Fields**: 必須設定 `useDefineForClassFields: false`
3. **Import 路徑**: 必須加上 `.js` 副檔名

```typescript
// 正確
import './app-shell.js';

// 錯誤
import './app-shell';
```

### Deno 相關

1. 使用 `nodeModulesDir: "auto"` 自動管理 node_modules
2. JSR 套件使用 `jsr:` 前綴
3. 第三方模組使用完整 URL

### 狀態更新

Store 使用觀察者模式，更新後需呼叫 `notify()`:

```typescript
class AppStore {
  private listeners = new Set<Listener>();

  setActiveTab(tab: TabType) {
    this.state.activeTab = tab;
    this.notify();  // 通知所有訂閱者
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}
```

---

## 檔案命名慣例

- 組件檔案: `kebab-case.ts` (e.g., `desktop-header.ts`)
- 組件標籤: `kebab-case` (e.g., `<desktop-header>`)
- Store/Service: `kebab-case.ts` (e.g., `app-store.ts`)
- 型別/介面: `PascalCase` (e.g., `AppStore`, `Topic`)
