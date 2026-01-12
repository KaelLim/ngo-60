FROM nginx:alpine

# 安裝 htpasswd 工具
RUN apk add --no-cache apache2-utils

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 預設密碼 (建議在生產環境中覆蓋)
ARG ADMIN_USER=admin
ARG ADMIN_PASSWORD=changeme

# 建立 htpasswd 檔案
RUN htpasswd -bc /etc/nginx/.htpasswd ${ADMIN_USER} ${ADMIN_PASSWORD}

EXPOSE 80
