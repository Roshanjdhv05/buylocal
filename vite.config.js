import { defineConfig } from 'vite';
import prerender from '@prerenderer/rollup-plugin';

// Pre-rendering is only active for standard static routes for SEO.
// Note: Generating dynamic product pages might require feeding the complete dynamic routes list.
// For now, we pre-render Home, Search, Stores, Trending, Categories to ensure Googlebot gets HTML.

export default defineConfig({
  plugins: [
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
      },
      postProcess(renderedRoute) {
        // Optional: remove extraneous tags or optimize output
        renderedRoute.html = renderedRoute.html.replace(
          /<script.*?><\/script>/g,
          ''
        );
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
