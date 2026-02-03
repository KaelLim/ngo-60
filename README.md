# NGO 60 週年活動網站

慈濟 60 週年活動網站 - Lit Web Components + Deno + Hono + PostgreSQL

## 快速開始

```bash
# 設定環境變數
cp .env.example .env

# 啟動服務
docker compose up -d --build

# 訪問 http://localhost:8973
```

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | Lit Web Components + TypeScript + Vite |
| 後端 | Deno + Hono |
| 資料庫 | PostgreSQL 18 |
| 反向代理 | Nginx |

## 專案結構

```
/
├── docker-compose.yml      # Docker 編排設定
├── .env.example            # 環境變數範本
├── TECH_STACK.md           # 技術棧說明
├── db/init.sql             # 資料庫 schema + 種子資料
├── api/                    # 後端 (Deno + Hono)
│   ├── main.ts
│   ├── db.ts
│   ├── Dockerfile
│   └── routes/
├── web/                    # 前端 (Lit)
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── controllers/
│       ├── services/
│       ├── stores/
│       └── styles/
├── nginx/                  # Nginx 反向代理
│   ├── nginx.conf
│   └── Dockerfile
├── scripts/                # 工具腳本
└── seed/                   # 種子資料 (圖片等)
```

## 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `ADMIN_USER` | admin | 後台帳號 |
| `ADMIN_PASSWORD` | changeme | 後台密碼 |
| `DB_PASSWORD` | postgres | 資料庫密碼 |
| `PORT` | 8973 | 對外 Port |

## 常用指令

```bash
# 啟動服務
docker compose up -d --build

# 查看日誌
docker compose logs -f

# 停止服務
docker compose down

# 重新建置
docker compose up -d --build --force-recreate
```

## 資料備份

```bash
# 備份資料庫
docker compose exec db pg_dump -U postgres events_app > backup.sql

# 還原資料庫
cat backup.sql | docker compose exec -T db psql -U postgres -d events_app

# 備份上傳檔案
docker run --rm -v tzuchi-60_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads.tar.gz -C /data .
```

## 存取網址

| 服務 | URL |
|------|-----|
| 前台 | http://localhost:8973/ |
| 後台 | http://localhost:8973/dashboard/ |

後台使用 Basic Auth，帳密請參考 `.env` 設定