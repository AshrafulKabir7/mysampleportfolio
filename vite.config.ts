import { defineConfig } from "vite";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    target: "es2022",
    cssCodeSplit: true,
  },
  ssr: {
    // Bundle these into the prerender build so Node never has to resolve CSS imports
    noExternal: [/^@fontsource/, "lenis", "cmdk", "sonner"],
  },
});
