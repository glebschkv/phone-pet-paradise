import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks(id) {
          // Vendor chunks - split by usage pattern
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/react-router')) {
              return 'vendor-react';
            }
            // All Radix UI packages (including internal dependencies)
            if (id.includes('/@radix-ui/')) {
              return 'vendor-radix';
            }
            // 3D graphics
            if (id.includes('/three/') || id.includes('/@react-three/')) {
              return 'vendor-three';
            }
            // Animation
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            // Data layer
            if (id.includes('/@supabase/') || id.includes('/@tanstack/')) {
              return 'vendor-data';
            }
            // Note: Using minimal custom Sentry client (~3KB) instead of full SDK
            // No vendor-monitoring chunk needed - Sentry packages are not imported
            // Utilities
            if (id.includes('/date-fns/') || id.includes('/clsx/') || id.includes('/tailwind-merge/') || id.includes('/class-variance-authority/')) {
              return 'vendor-utils';
            }
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Use esbuild for minification (faster and bundled with Vite)
    minify: 'esbuild',
    // Enable source maps for production debugging
    sourcemap: mode !== 'production',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'date-fns',
    ],
  },
}));
