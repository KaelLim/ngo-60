# Stage 1: Build with Deno + Vite
FROM denoland/deno:alpine AS builder
WORKDIR /app

COPY deno.json deno.lock* ./
RUN deno install --node-modules-dir --entrypoint npm:vite

COPY . .
RUN deno run -A --node-modules-dir npm:vite build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
