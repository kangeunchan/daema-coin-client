import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    host: "0.0.0.0",
    port: 4174,
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  test: {
    css: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
