import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import FullReload from 'vite-plugin-full-reload';

export default defineConfig({
  plugins: [
    react(),
    FullReload(['index.html', 'public/**/*']),
  ],
  server: {
    port: 3000,
    hmr: { overlay: true },
  },
});
