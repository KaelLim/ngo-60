FROM denoland/deno:2.1.4 as builder

WORKDIR /app

# 複製設定檔
COPY deno.json .
COPY package.json .

# 安裝依賴
RUN deno install --node-modules-dir --entrypoint npm:vite

# 複製原始碼
COPY . .

# 建置
RUN deno run -A --node-modules-dir npm:vite build

# 輸出 dist 到 volume
FROM alpine:latest as output
COPY --from=builder /app/dist /dist

CMD ["cp", "-r", "/dist/.", "/output/"]
