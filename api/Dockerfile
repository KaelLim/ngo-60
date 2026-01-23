FROM denoland/deno:latest
WORKDIR /app

# Cache dependencies first
COPY api/deno.json .
RUN deno install --node-modules-dir

# Copy API source
COPY api/ .
RUN deno cache --node-modules-dir main.ts

# Copy seed gallery images
RUN mkdir -p uploads/gallery
COPY seed/gallery/ uploads/gallery/

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-ffi", "--node-modules-dir", "main.ts"]
