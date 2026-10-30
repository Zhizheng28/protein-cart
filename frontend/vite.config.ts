import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { brand } from "./src/brand";

/** Fill %APP_NAME% / %APP_TAGLINE% in the HTML from brand.ts, so the name lives in one file. */
function brandHtml(): Plugin {
  return {
    name: "brand-html",
    transformIndexHtml(html) {
      return html.replaceAll("%APP_NAME%", brand.name).replaceAll("%APP_TAGLINE%", brand.tagline);
    },
  };
}

// `--mode static` builds the GitHub Pages site: relative URLs, no server needed.
export default defineConfig(({ mode }) => ({
  base: mode === "static" ? "./" : "/",
  plugins: [react(), tailwindcss(), brandHtml()],
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, "index.html"),
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
  server: { proxy: { "/api": "http://localhost:8000" } },
}));
