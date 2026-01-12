FROM denoland/deno:latest

WORKDIR /app

# Cache dependencies
COPY deno.json .
RUN deno install

# Copy source
COPY . .

# 建立上傳目錄
RUN mkdir -p uploads/gallery

# Cache the main module
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "main.ts"]
