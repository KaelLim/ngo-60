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
| `LLM_BASE_URL` | — | 祝福語 AI 審查的 LLM Gateway 網址 |
| `LLM_API_KEY` | — | LLM Gateway 金鑰（`sk-llm-*`），**約 30 天到期，需定期更新**，見下方 |

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

## LLM 審查金鑰輪替（每 ~30 天）⚠️

祝福語送出前會經過 LLM Gateway 做 AI 審查（髒話、攻擊慈濟等內容會被擋下，不存入資料庫）。
**`LLM_API_KEY`（`sk-llm-*`）自簽發起算約 30 天到期。** 到期後審查會一律不通過，
log 出現 `審查服務未設定 / 審查服務暫時無法使用`。

到期前（或看到上述 log 時）依下列步驟更新：

```bash
# 1. 到 LLM Gateway 後台重新簽發一把 sk-llm-* key（僅顯示一次，立即複製）

# 2. 編輯 .env，更新 LLM_API_KEY
nano .env            # 正式機檔案屬 root 時用 sudo nano .env

# 3. 重建容器讓新 key 生效（用 restart 不會生效！）
docker compose up -d api     # 正式機服務名為 app：docker compose up -d app

# 4. 確認容器已讀到新 key
docker compose exec api printenv | grep LLM
```

> 注意：`restart` 只會沿用舊容器與舊環境變數，**改 `.env` 後一定要 `up -d` 重建容器**才會讀到新 key。

## 存取網址

| 服務 | URL |
|------|-----|
| 前台 | http://localhost:8973/ |
| 後台 | http://localhost:8973/dashboard/ |

後台使用 Basic Auth，帳密請參考 `.env` 設定