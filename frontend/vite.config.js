import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/", // ✅ Keeps asset paths absolute
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      host: "localhost",
      protocol: "ws",
      clientPort: 5173,
    },
  },
});
