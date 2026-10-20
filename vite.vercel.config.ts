import { defineConfig } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/postcss";
import { fileURLToPath } from "node:url";

// Keep the local Cloudflare preview configuration separate from Vercel output.
export default defineConfig({
  // Nitro's server resolution can externalize bare CSS package imports.
  resolve: { alias: [{ find: /^tailwindcss$/, replacement: fileURLToPath(import.meta.resolve("tailwindcss/index.css")) }] },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext(), nitro({ preset: "vercel" })],
});
