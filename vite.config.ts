import { defineConfig } from "vite";

export default defineConfig({
  server: {
    preset: "cloudflare-pages",
    entry: "src/server.ts",
  },
});