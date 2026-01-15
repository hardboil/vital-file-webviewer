import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          pako: ['pako']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  },
  preview: {
    port: 4173
  }
});
