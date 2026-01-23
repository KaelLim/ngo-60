FROM denoland/deno:latest
WORKDIR /app

# Install Node.js + Claude Code CLI
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g @anthropic-ai/claude-code && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Cache dependencies first
COPY api/deno.json .
RUN deno install --node-modules-dir

# Copy API source
COPY api/ .
RUN deno cache --node-modules-dir main.ts
RUN deno cache --node-modules-dir agent-worker.ts

# Copy seed gallery images
RUN mkdir -p uploads/gallery
COPY seed/gallery/ uploads/gallery/

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-ffi", "--allow-sys", "--node-modules-dir", "main.ts"]
