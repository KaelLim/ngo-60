#!/bin/bash
# 備份 PostgreSQL 資料庫和上傳檔案
# 使用方式：./scripts/backup.sh
# 備份位置：./backups/
#
# 可設定環境變數：
#   BACKUP_DIR: 備份目錄（預設: ./backups）
#   KEEP_DAYS: 保留天數（預設: 7）

set -e

# 設定
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-7}"
DATE=$(date +%Y-%m-%d_%H%M%S)
COMPOSE_FILE="docker-compose.prod.yml"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  NGO60 備份工具${NC}"
echo -e "${YELLOW}  日期: ${DATE}${NC}"
echo -e "${YELLOW}========================================${NC}"

# 建立備份目錄
mkdir -p "${BACKUP_DIR}"

# 檢查 Docker 容器是否運行
echo -e "\n${YELLOW}[1/4] 檢查容器狀態...${NC}"
if ! docker compose -f ${COMPOSE_FILE} ps --status running | grep -q "db"; then
    echo -e "${RED}錯誤：PostgreSQL 容器未運行${NC}"
    echo -e "請先啟動：docker compose -f ${COMPOSE_FILE} up -d"
    exit 1
fi
echo -e "${GREEN}容器運行中${NC}"

# 備份 PostgreSQL
echo -e "\n${YELLOW}[2/4] 備份 PostgreSQL 資料庫...${NC}"
DB_BACKUP="${BACKUP_DIR}/db_${DATE}.sql"
docker compose -f ${COMPOSE_FILE} exec -T db pg_dump -U postgres events_app > "${DB_BACKUP}"
gzip "${DB_BACKUP}"
echo -e "${GREEN}資料庫備份完成: ${DB_BACKUP}.gz${NC}"

# 備份 uploads
echo -e "\n${YELLOW}[3/4] 備份上傳檔案...${NC}"
UPLOADS_BACKUP="${BACKUP_DIR}/uploads_${DATE}.tar.gz"

# 從 Docker volume 複製 uploads
CONTAINER_ID=$(docker compose -f ${COMPOSE_FILE} ps -q api)
if [ -n "$CONTAINER_ID" ]; then
    docker cp "${CONTAINER_ID}:/app/uploads" "${BACKUP_DIR}/uploads_temp"
    tar -czf "${UPLOADS_BACKUP}" -C "${BACKUP_DIR}" uploads_temp
    rm -rf "${BACKUP_DIR}/uploads_temp"
    echo -e "${GREEN}上傳檔案備份完成: ${UPLOADS_BACKUP}${NC}"
else
    echo -e "${YELLOW}警告：API 容器未運行，跳過 uploads 備份${NC}"
fi

# 清理舊備份
echo -e "\n${YELLOW}[4/4] 清理超過 ${KEEP_DAYS} 天的舊備份...${NC}"
find "${BACKUP_DIR}" -name "db_*.sql.gz" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true
find "${BACKUP_DIR}" -name "uploads_*.tar.gz" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true
echo -e "${GREEN}清理完成${NC}"

# 顯示備份摘要
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  備份完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n備份檔案："
ls -lh "${BACKUP_DIR}"/*_${DATE}* 2>/dev/null || echo "（無檔案）"
echo -e "\n備份目錄大小："
du -sh "${BACKUP_DIR}"
