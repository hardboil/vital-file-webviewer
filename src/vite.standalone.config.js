import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Standalone build configuration
 *
 * Creates a single HTML file that can be opened directly in a browser
 * without needing a web server. All JS, CSS, and assets are inlined.
 *
 * Usage:
 *   bun run build:standalone
 *   # or
 *   make standalone
 *
 * Output:
 *   dist/vitaldb-viewer.html
 */
export default defineConfig({
  root: '.',
  base: './',
  plugins: [
    viteSingleFile({
      removeViteModuleLoader: true,
      useRecommendedBuildConfig: true
    })
  ],
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    // Single file output
    rollupOptions: {
      output: {
        // Custom filename for standalone version
        entryFileNames: 'vitaldb-viewer.js',
        assetFileNames: 'vitaldb-viewer.[ext]'
      }
    },
    // Inline all assets
    assetsInlineLimit: 100000000,
    cssCodeSplit: false
  },
  // Rename output HTML
  experimental: {
    renderBuiltUrl(filename) {
      return filename;
    }
  }
});
