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

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/categories?type=topic\|impact` | 類別列表 |
| `GET /api/events?month=4&year=2026` | 活動時程 |
| `GET /api/blessings` | 祝福列表 |
| `POST /api/blessings` | 新增祝福 |
| `GET /api/gallery/random?count=15` | 隨機圖片 |
