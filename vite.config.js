import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  envDir: "../",
  base: "/GENAIHACKATHON/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
