import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the Vite dev server proxies /api to the Express API, so cookies stay same-site.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: process.env.VITE_API_PROXY || 'http://localhost:5000', changeOrigin: false } } },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js', css: false },
});
