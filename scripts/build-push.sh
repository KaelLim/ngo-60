#!/bin/bash
# 建置並推送 Docker images 到 Docker Hub
# 使用方式：./scripts/build-push.sh [tag]
# 範例：
#   ./scripts/build-push.sh          # 使用 latest
#   ./scripts/build-push.sh v1.0.0   # 使用指定版本

set -e

# 設定
DOCKER_USERNAME="kaellim"
TAG="${1:-latest}"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  NGO60 Docker Build & Push${NC}"
echo -e "${YELLOW}  Tag: ${TAG}${NC}"
echo -e "${YELLOW}========================================${NC}"

# 確認已登入 Docker Hub
echo -e "\n${YELLOW}[1/5] 檢查 Docker Hub 登入狀態...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${RED}請先登入 Docker Hub: docker login${NC}"
    exit 1
fi
echo -e "${GREEN}已登入 Docker Hub${NC}"

# 建置 API image
echo -e "\n${YELLOW}[2/5] 建置 API image...${NC}"
docker build -t ${DOCKER_USERNAME}/ngo60-api:${TAG} ./api
echo -e "${GREEN}API image 建置完成${NC}"

# 建置 Nginx image（包含前端）
echo -e "\n${YELLOW}[3/5] 建置 Nginx image（含前端）...${NC}"
docker build -t ${DOCKER_USERNAME}/ngo60-nginx:${TAG} -f nginx/Dockerfile.full .
echo -e "${GREEN}Nginx image 建置完成${NC}"

# 推送到 Docker Hub
echo -e "\n${YELLOW}[4/5] 推送 images 到 Docker Hub...${NC}"
docker push ${DOCKER_USERNAME}/ngo60-api:${TAG}
docker push ${DOCKER_USERNAME}/ngo60-nginx:${TAG}
echo -e "${GREEN}推送完成${NC}"

# 如果不是 latest，也推送 latest tag
if [ "$TAG" != "latest" ]; then
    echo -e "\n${YELLOW}[5/5] 同時更新 latest tag...${NC}"
    docker tag ${DOCKER_USERNAME}/ngo60-api:${TAG} ${DOCKER_USERNAME}/ngo60-api:latest
    docker tag ${DOCKER_USERNAME}/ngo60-nginx:${TAG} ${DOCKER_USERNAME}/ngo60-nginx:latest
    docker push ${DOCKER_USERNAME}/ngo60-api:latest
    docker push ${DOCKER_USERNAME}/ngo60-nginx:latest
    echo -e "${GREEN}latest tag 更新完成${NC}"
else
    echo -e "\n${YELLOW}[5/5] 跳過（已使用 latest tag）${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  全部完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nImages:"
echo -e "  - ${DOCKER_USERNAME}/ngo60-api:${TAG}"
echo -e "  - ${DOCKER_USERNAME}/ngo60-nginx:${TAG}"
echo -e "\n部署指令："
echo -e "  docker pull ${DOCKER_USERNAME}/ngo60-api:${TAG}"
echo -e "  docker pull ${DOCKER_USERNAME}/ngo60-nginx:${TAG}"
