import type { StorybookConfig } from "@storybook/html-vite";
import tailwindcss from "@tailwindcss/vite";

// The component catalogue (rules/storybook.md). It is plain HTML: Astro
// components can't run in the browser, so `bun run storybook:render` renders
// each state of each component with Astro's own container first, and a story
// shows that markup. See docs/storybook.md.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.ts"],
  addons: [],
  framework: "@storybook/html-vite",
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
  }),
};

export default config;
