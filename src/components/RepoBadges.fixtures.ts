// What each story of RepoBadges renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import { badges } from "../../.storybook/sample";
import type { StoryState } from "../../scripts/render-stories";
import Component from "./RepoBadges.astro";

export { Component };

export const states: Record<string, StoryState> = {
  WithBadges: { props: { name: "example-api", badges } },
  NoBadges: { props: { name: "example-api", badges: [] } },
};
