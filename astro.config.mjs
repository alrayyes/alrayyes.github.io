// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Fully static — a list of links with no server-side logic at all, deployed
// as plain files through GitHub Pages (the `deploy` job in
// .github/workflows/ci.yml), not Cloudflare Workers the way this account's
// other Astro sites are —
// apis.ryankes.eu is a DNS CNAME onto alrayyes.github.io, so GitHub Pages
// is the deliberate target here.
export default defineConfig({
  site: "https://apis.ryankes.eu",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
