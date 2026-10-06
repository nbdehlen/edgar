import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'API_PROXY_TARGET');

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://127.0.0.1:3001', rewrite: (path) => path.replace(/^\/api/, '') } }
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/testSetup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      clearMocks: true
    }
  };
});
