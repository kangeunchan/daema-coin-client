import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const normalizeModuleId = (id: string) => id.replaceAll("\\", "/");
const includesPackage = (id: string, packageName: string) =>
  normalizeModuleId(id).includes(`/node_modules/${packageName}/`);

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-core",
              priority: 40,
              test: (id) =>
                includesPackage(id, "react") ||
                includesPackage(id, "react-dom") ||
                includesPackage(id, "scheduler"),
            },
            {
              maxSize: 450_000,
              name: "three-core",
              priority: 30,
              test: (id) => includesPackage(id, "three"),
            },
            {
              maxSize: 450_000,
              name: "react-three",
              priority: 20,
              test: (id) =>
                includesPackage(id, "@react-three/fiber") ||
                includesPackage(id, "@react-three/drei") ||
                includesPackage(id, "react-use-measure") ||
                includesPackage(id, "zustand"),
            },
            {
              name: "ui-primitives",
              priority: 10,
              test: (id) =>
                includesPackage(id, "@radix-ui/react-slot") ||
                includesPackage(id, "class-variance-authority") ||
                includesPackage(id, "clsx") ||
                includesPackage(id, "tailwind-merge"),
            },
            {
              name: "soccer-lineup",
              priority: 9,
              test: (id) => includesPackage(id, "react-soccer-lineup"),
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
  resolve: {
    dedupe: ["three"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  test: {
    css: true,
    environment: "jsdom",
    server: {
      deps: {
        inline: ["react-soccer-lineup"],
      },
    },
    setupFiles: "./src/test/setup.ts",
  },
});
