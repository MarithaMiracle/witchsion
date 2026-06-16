import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    entry: "src/server.ts",
  },
  vite: {
    build: {
      outDir: "dist/client",
    },
  },
});