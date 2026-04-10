import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from '@prerenderer/rollup-plugin';

export default defineConfig({
  plugins: [
    react(),
    prerender({
      routes: [
        '/',
        '/search',
        '/trending',
        '/stores',
        '/categories'
      ],
      renderer: '@prerenderer/renderer-jsdom',
      rendererOptions: {
        maxConcurrentRoutes: 1,
        renderAfterTime: 5000 // wait for 5 seconds to ensure React loads
      }
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
          ui: ['lucide-react', 'framer-motion']
        }
      }
    }
  }
});
