import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // GitHub Pages: /repo-name/ | Local: ./
  base: process.env.GITHUB_ACTIONS ? '/vital-file-webviewer/' : './',
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
