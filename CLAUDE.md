# CLAUDE.md

慈濟 60 週年活動網站 - Lit Web Components + Deno + Hono + PostgreSQL

## Quick Start

```bash
docker compose up -d --build   # 啟動 → http://localhost:8973
docker compose down            # 停止
```

Docker 專案名稱：`tzuchi-60`

## Tech Stack

- **Frontend**: Lit Web Components + TypeScript + Vite
- **Backend**: Deno + Hono
- **Database**: PostgreSQL
- **State**: @lit/context + Store pattern

## Project Structure

```
/
├── docker-compose.yml      # Docker 編排設定
├── api/                    # Backend (Deno + Hono)
│   ├── main.ts
│   ├── db.ts
│   └── routes/
├── web/                    # Frontend (Lit)
│   └── src/
│       ├── components/
│       ├── stores/
│       └── services/
├── db/init.sql             # Schema + seed data
└── nginx/                  # Nginx 反向代理
```

## Cache Busting (IMPORTANT)

Dashboard 靜態檔案不經過 Vite 打包，瀏覽器會快取舊版本。每次更新 dashboard 相關程式碼後，**必須**更新版本號：

- 檔案：`web/public/dashboard/index.html`
- 位置：`css/styles.css?v=X.X` 和 `js/main.js?v=X.X`
- **當前版本：`1.1`**

每次 push 有修改到 dashboard 的 CSS/JS 時，版本號 +0.1。

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/categories?type=topic\|impact` | 類別列表 |
| `GET /api/events?month=4&year=2026` | 活動時程 |
| `GET /api/blessings` | 祝福列表 |
| `POST /api/blessings` | 新增祝福 |
| `GET /api/gallery/random?count=15` | 隨機圖片 |
