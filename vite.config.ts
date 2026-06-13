import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({ 
  optimizeDeps: {
    exclude: ["brotli-wasm"]
  },
  worker: {
    format: "es"
  },
  plugins: [tailwindcss(), sveltekit()] 
});
