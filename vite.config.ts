import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.VITE_PORT || '8080'),
    hmr: {
      port: parseInt(process.env.VITE_PORT || '8080'),
      host: "0.0.0.0",
    },
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Monaco Editor into separate chunk
          'monaco': ['@monaco-editor/react'],
          // Split html2canvas into separate chunk
          'html2canvas': ['html2canvas'],
          // Split React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split UI components
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-popover'],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 KB
  },
}));
