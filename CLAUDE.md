# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

慈濟 60 週年活動網站 - 使用 Lit Web Components + Deno + PostgreSQL 建構的 SPA。

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Lit Web Components + TypeScript |
| Frontend State | @lit/context + Store pattern |
| Frontend Build | Vite (via Deno) |
| Backend Runtime | Deno |
| Backend Framework | Hono |
| Database | PostgreSQL 18 |
| Containerization | Docker Compose |

## Development

**全部使用 Deno，無需 npm：**

```bash
# 一鍵啟動 (資料庫 + API + 前端)
deno task start

# 或分開執行：
deno task db:up      # 啟動 PostgreSQL
deno task dev        # 同時啟動 API + 前端
```

**可用指令：**
| 指令 | 說明 |
|------|------|
| `deno task start` | 啟動全部 (DB + API + Web) |
| `deno task dev` | 同時啟動 API + Web |
| `deno task dev:api` | 只啟動 API (port 8000) |
| `deno task dev:web` | 只啟動前端 (port 5173) |
| `deno task db:up` | 啟動 PostgreSQL |
| `deno task db:down` | 停止 PostgreSQL |

## Project Structure

```
/
├── docker-compose.yml          # PostgreSQL container
├── db/
│   └── init.sql               # Database schema + seed data
├── api/                       # Deno + Hono backend
│   ├── deno.json
│   ├── main.ts
│   ├── db.ts
│   ├── uploads/gallery/       # Uploaded images
│   └── routes/
│       ├── categories.ts
│       ├── events.ts
│       ├── news.ts
│       ├── activities.ts
│       ├── gallery.ts
│       └── homepage.ts
└── web/                       # Lit frontend
    ├── deno.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.ts
        ├── styles/global.css
        ├── services/api.ts
        ├── stores/
        ├── contexts/
        ├── controllers/
        └── components/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/categories?type=topic` | GET | 取得主題類別 |
| `/api/categories?type=impact` | GET | 取得影響類別 |
| `/api/events?month=4&year=2026` | GET | 取得特定月份活動 |
| `/api/news?category_id=1` | GET | 取得特定類別新聞 |
| `/api/activities?month=4` | GET | 取得月份活動 |
| `/api/gallery/random?count=15` | GET | 隨機取得圖片 |
| `/api/gallery` | POST | 上傳圖片 |
| `/api/homepage` | GET/PUT | 首頁內容 |
| `/uploads/gallery/*` | GET | 靜態圖片 |

## Frontend Architecture

**State Management:** @lit/context + Store pattern
- `AppStore`: UI state (tabs, navigation, sheet position)
- `DataStore`: Data from API (categories, events, news)

**Components:**
- `app-root`: Root component, provides contexts
- `app-homepage`: Homepage with gallery grid
- `homepage-grid`: 4x5 circular image grid
- `homepage-tabs`: Tab navigation (看時程/看主題/看影響)

## Database Tables

- `categories`: 類別 (topic/impact)
- `events`: 活動時程
- `news`: 新聞內容
- `activities`: 月份活動
- `gallery`: 圖片 metadata
- `homepage`: 首頁內容 (slogan, title, content)
