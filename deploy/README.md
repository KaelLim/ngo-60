# NGO60 部署指南

## 系統需求

- Docker Engine 20.10+
- Docker Compose v2+
- 至少 1GB RAM
- 至少 10GB 硬碟空間

## 快速部署

```bash
# 1. 進入部署目錄
cd deploy

# 2. 設定環境變數
cp .env.example .env
nano .env  # 修改密碼等設定

# 3. 啟動服務
docker compose up -d

# 4. 查看狀態
docker compose ps

# 5. 查看日誌
docker compose logs -f
```

## 服務說明

| 服務 | 說明 | Port |
|------|------|------|
| nginx | 前端 + 反向代理 | 80 |
| api | 後端 API | (內部) |
| db | PostgreSQL 資料庫 | (內部) |

## 存取網站

- 前台：http://your-server-ip/
- 後台：http://your-server-ip/dashboard/
  - 帳號：admin
  - 密碼：（預設 changeme，建議修改 nginx image）

## 常用指令

```bash
# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f
docker compose logs -f api  # 只看 API 日誌

# 重啟服務
docker compose restart

# 停止服務
docker compose stop

# 完全移除（保留資料）
docker compose down

# 完全移除（包含資料）⚠️ 危險
docker compose down -v

# 更新到最新版本
docker compose pull
docker compose up -d
```

## 資料備份

### 備份資料庫

```bash
# 匯出資料庫
docker compose exec db pg_dump -U postgres events_app > backup.sql

# 匯出並壓縮
docker compose exec db pg_dump -U postgres events_app | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 還原資料庫

```bash
# 從 SQL 檔案還原
cat backup.sql | docker compose exec -T db psql -U postgres -d events_app

# 從壓縮檔還原
gunzip -c backup_20260112.sql.gz | docker compose exec -T db psql -U postgres -d events_app
```

### 備份上傳檔案

```bash
# 匯出 uploads volume
docker run --rm -v deploy_uploads_data:/data -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .

# 還原 uploads volume
docker run --rm -v deploy_uploads_data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads_backup.tar.gz -C /data
```

## 檔案結構

```
deploy/
├── docker-compose.yml  # Docker 編排設定
├── .env.example        # 環境變數範本
├── .env                # 實際環境變數（需自行建立）
├── init.sql            # 資料庫初始化腳本
└── README.md           # 本說明文件
```

## 故障排除

### 無法連線

1. 檢查防火牆是否開放 port 80
2. 檢查服務是否運行：`docker compose ps`
3. 查看錯誤日誌：`docker compose logs`

### 資料庫連線失敗

1. 等待資料庫啟動完成（約 30 秒）
2. 檢查 .env 密碼設定是否正確
3. 查看 db 日誌：`docker compose logs db`

### 更新後無法啟動

```bash
# 強制重新拉取 image
docker compose pull --force
docker compose up -d --force-recreate
```

## 技術支援

如有問題請聯繫開發團隊。
