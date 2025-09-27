import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom',
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', '@clerk/clerk-react'],
    exclude: ['lucide-react'],
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
          qr: ['qrcode', 'html5-qrcode', 'react-qr-scanner'],
        },
      },
      external: [],
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minify CSS
    cssCodeSplit: true,
    // Target modern browsers for better performance
    target: 'esnext',
  },
  // Enable gzip compression
  server: {
    compress: true,
    port: 5175,
    host: true,
  },
});
