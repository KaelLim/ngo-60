FROM denoland/deno:2.1.4

WORKDIR /app

# Cache dependencies
COPY deno.json .
RUN deno install

# Copy source
COPY . .

# Cache the main module
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "--allow-net", "--allow-env", "main.ts"]
