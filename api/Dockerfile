FROM denoland/deno:latest
WORKDIR /app

# Cache dependencies first
COPY deno.json .
RUN deno install --node-modules-dir

# Copy source
COPY . .
RUN deno cache --node-modules-dir main.ts

# Upload directory
RUN mkdir -p uploads/gallery

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-ffi", "--node-modules-dir", "main.ts"]
