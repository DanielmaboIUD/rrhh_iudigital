import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const certs = resolve(import.meta.dirname, "../certs");

// El proxy evita CORS: el navegador solo habla con Vite.
// Los certificados solo se exigen en dev para que `vite build` funcione sin ellos.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  server:
    command === "serve"
      ? {
          https: {
            cert: readFileSync(resolve(certs, "localhost.pem")),
            key: readFileSync(resolve(certs, "localhost-key.pem")),
          },
          proxy: { "/api": { target: "https://localhost:3000", secure: true } },
        }
      : undefined,
}));
