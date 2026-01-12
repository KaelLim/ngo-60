import { defineConfig } from 'npm:vite@^5.4.0';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname!, 'index.html'),
        admin: resolve(import.meta.dirname!, 'admin.html')
      }
    }
  }
});
