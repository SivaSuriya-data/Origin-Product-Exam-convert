import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['pyodide'],
    include: ['jszip', 'pdf-lib']
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    fs: {
      allow: ['..']
    }
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          'pyodide': ['pyodide'],
          'wasm': ['jszip', 'pdf-lib'],
          'vendor': ['react', 'react-dom'],
          'ui': ['lucide-react', 'tailwindcss']
        }
      }
    },
    rollupOptions: {
      external: [],
      output: {
        format: 'es'
      }
    }
  }
});