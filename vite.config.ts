import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/notion": {
        target: "https://api.notion.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/notion/, ""),
      },
    },
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({ customViteReactPlugin: true }),
    viteReact(),
    tailwindcss(),
  ],
});
