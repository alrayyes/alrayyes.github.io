import type { Preview } from "@storybook/html-vite";
// The site's one stylesheet and its font, as Layout.astro loads them, so a
// story looks like the page it comes from.
import "../src/styles/global.css";

// The site themes on <html data-theme>, set by an inline script in the layout.
// A toolbar switch sets it the same way, so every story shows in both modes.
const preview: Preview = {
  parameters: { layout: "padded" },
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        title: "Theme",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      return story();
    },
  ],
};

export default preview;
