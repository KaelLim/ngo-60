#!/bin/bash
# NGO60 一鍵部署腳本
# 使用方式：curl -fsSL https://raw.githubusercontent.com/KaelLim/ngo-60/main/scripts/deploy.sh | bash

set -e

# 顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  NGO60 一鍵部署${NC}"
echo -e "${YELLOW}========================================${NC}"

# 檢查 Docker
echo -e "\n${YELLOW}[1/4] 檢查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "錯誤：請先安裝 Docker"
    exit 1
fi
echo -e "${GREEN}Docker 已安裝${NC}"

# Clone 或更新專案
echo -e "\n${YELLOW}[2/4] 取得專案...${NC}"
if [ -d "ngo-60" ]; then
    echo "專案已存在，更新中..."
    cd ngo-60
    git pull
else
    echo "Clone 專案中..."
    git clone https://github.com/KaelLim/ngo-60.git
    cd ngo-60
fi
echo -e "${GREEN}專案已準備${NC}"

# 設定環境變數
echo -e "\n${YELLOW}[3/4] 設定環境變數...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}已建立 .env 檔案${NC}"
else
    echo -e "${GREEN}.env 已存在，跳過${NC}"
fi

# 啟動 Docker
echo -e "\n${YELLOW}[4/4] 啟動服務...${NC}"
docker compose -f docker-compose.prod.yml up -d --build

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n前台：http://localhost/"
echo -e "後台：http://localhost/dashboard/"
echo -e "  帳號：admin"
echo -e "  密碼：changeme"
echo -e "\n查看日誌：docker compose -f docker-compose.prod.yml logs -f"
