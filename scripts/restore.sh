#!/bin/bash
# 還原 PostgreSQL 資料庫和上傳檔案
# 使用方式：./scripts/restore.sh [backup_date]
# 範例：
#   ./scripts/restore.sh 2026-01-12_103000   # 還原指定日期
#   ./scripts/restore.sh                      # 列出可用備份

set -e

# 設定
BACKUP_DIR="${BACKUP_DIR:-./backups}"
COMPOSE_FILE="docker-compose.prod.yml"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  NGO60 還原工具${NC}"
echo -e "${YELLOW}========================================${NC}"

# 列出可用備份
list_backups() {
    echo -e "\n${YELLOW}可用的備份：${NC}"
    echo -e "----------------------------------------"
    for f in "${BACKUP_DIR}"/db_*.sql.gz; do
        if [ -f "$f" ]; then
            DATE=$(basename "$f" | sed 's/db_\(.*\)\.sql\.gz/\1/')
            DB_SIZE=$(ls -lh "$f" | awk '{print $5}')
            UPLOADS_FILE="${BACKUP_DIR}/uploads_${DATE}.tar.gz"
            if [ -f "$UPLOADS_FILE" ]; then
                UPLOADS_SIZE=$(ls -lh "$UPLOADS_FILE" | awk '{print $5}')
                echo -e "  ${GREEN}${DATE}${NC}  DB: ${DB_SIZE}  Uploads: ${UPLOADS_SIZE}"
            else
                echo -e "  ${GREEN}${DATE}${NC}  DB: ${DB_SIZE}  Uploads: (無)"
            fi
        fi
    done
    echo -e "----------------------------------------"
    echo -e "\n使用方式: $0 <backup_date>"
    echo -e "範例: $0 2026-01-12_103000"
}

# 如果沒有參數，列出備份
if [ -z "$1" ]; then
    list_backups
    exit 0
fi

RESTORE_DATE="$1"
DB_BACKUP="${BACKUP_DIR}/db_${RESTORE_DATE}.sql.gz"
UPLOADS_BACKUP="${BACKUP_DIR}/uploads_${RESTORE_DATE}.tar.gz"

# 檢查備份檔案是否存在
if [ ! -f "$DB_BACKUP" ]; then
    echo -e "${RED}錯誤：找不到備份檔案 ${DB_BACKUP}${NC}"
    list_backups
    exit 1
fi

# 確認還原
echo -e "\n${RED}警告：還原將覆蓋現有資料！${NC}"
echo -e "即將還原的備份: ${RESTORE_DATE}"
read -p "確定要繼續嗎？(y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消${NC}"
    exit 0
fi

# 檢查容器狀態
echo -e "\n${YELLOW}[1/3] 檢查容器狀態...${NC}"
if ! docker compose -f ${COMPOSE_FILE} ps --status running | grep -q "db"; then
    echo -e "${RED}錯誤：PostgreSQL 容器未運行${NC}"
    echo -e "請先啟動：docker compose -f ${COMPOSE_FILE} up -d"
    exit 1
fi
echo -e "${GREEN}容器運行中${NC}"

# 還原資料庫
echo -e "\n${YELLOW}[2/3] 還原 PostgreSQL 資料庫...${NC}"
gunzip -c "${DB_BACKUP}" | docker compose -f ${COMPOSE_FILE} exec -T db psql -U postgres -d events_app
echo -e "${GREEN}資料庫還原完成${NC}"

# 還原 uploads
echo -e "\n${YELLOW}[3/3] 還原上傳檔案...${NC}"
if [ -f "$UPLOADS_BACKUP" ]; then
    CONTAINER_ID=$(docker compose -f ${COMPOSE_FILE} ps -q api)
    if [ -n "$CONTAINER_ID" ]; then
        # 解壓到暫存目錄
        tar -xzf "${UPLOADS_BACKUP}" -C "${BACKUP_DIR}"
        # 複製到容器
        docker cp "${BACKUP_DIR}/uploads_temp/." "${CONTAINER_ID}:/app/uploads/"
        rm -rf "${BACKUP_DIR}/uploads_temp"
        echo -e "${GREEN}上傳檔案還原完成${NC}"
    else
        echo -e "${YELLOW}警告：API 容器未運行，跳過 uploads 還原${NC}"
    fi
else
    echo -e "${YELLOW}警告：找不到 uploads 備份檔案，跳過${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  還原完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n建議重啟服務："
echo -e "  docker compose -f ${COMPOSE_FILE} restart"
