import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendOrigin = env.VITE_BACKEND_ORIGIN || "http://100.105.34.84:8080";

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5174,
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true
        },
        "/health": {
          target: backendOrigin,
          changeOrigin: true
        }
      }
    }
  };
});
