import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// El proxy evita CORS: el navegador solo habla con Vite
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://localhost:3000" },
  },
});
