// @ts-check
import codecovAstroPlugin from "@codecov/astro-plugin";
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
  // The one stylesheet is about 5 KB, so it is inlined rather than fetched: a
  // linked file blocks first paint for a round trip (Lighthouse's
  // render-blocking insight) and GitHub Pages sets no cache headers to make
  // that round trip cheap on a repeat visit.
  build: { inlineStylesheets: "always" },
  integrations: [
    // Bundle size analysis, uploaded to Codecov during the CI build. Last in
    // the list, as the plugin asks. With no CODECOV_TOKEN (a local build, a
    // Dependabot run) it runs dry instead of failing the build.
    codecovAstroPlugin({
      enableBundleAnalysis: true,
      bundleName: "alrayyes.github.io",
      uploadToken: process.env.CODECOV_TOKEN,
      gitService: "github",
      dryRun: !process.env.CODECOV_TOKEN,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
