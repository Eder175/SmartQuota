import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    open: true,
    hmr: {
      port: 8081,
      protocol: "ws",
    },
    proxy: {
      "/api/coingecko": {
        target: "https://api.coingecko.com/api/v3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, ""),
        timeout: 20000, // Aumentado para 20 segundos para lidar com atrasos
        onProxyError: (err, req, res) => {
          console.error(`Erro de proxy para ${req.url}:`, err.message);
          if (!res.headersSent) {
            res.statusCode = 503;
            res.end("Erro ao conectar à API. Tente novamente mais tarde.");
          }
        },
      },
    },
  },
  preview: {
    port: 5000,
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
  esbuild: {
    jsx: "automatic",
  },
});