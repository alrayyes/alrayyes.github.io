// What each story of RepoGroupCard renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import { apiPassing, bare, failing } from "../../.storybook/sample";
import type { StoryState } from "../../scripts/render-stories";
import Component from "./RepoGroupCard.astro";

export { Component };

export const states: Record<string, StoryState> = {
  ApiCard: {
    props: {
      section: {
        type: "api",
        title: "example-api",
        description: "A made-up API with two SDKs.",
        rows: [apiPassing],
      },
    },
  },
  ProductCard: {
    props: { section: { type: "product", title: "Example product", rows: [failing] } },
  },
  ScaffoldsCard: {
    props: {
      section: {
        type: "scaffolds",
        title: "Scaffolds",
        description: "Templates for new repos.",
        rows: [
          bare,
          { ...bare, name: "scaffold-other", repo: "https://github.com/alrayyes/scaffold-other" },
        ],
      },
    },
  },
  OtherCard: {
    props: { section: { type: "other", title: "Everything else", rows: [failing, bare] } },
  },
};
