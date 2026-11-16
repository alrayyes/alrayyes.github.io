// What each story of SiteHeader renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import type { StoryState } from "../../scripts/render-stories";
import Component from "./SiteHeader.astro";

export { Component };

export const states: Record<string, StoryState> = {
  Home: { url: "/" },
  Subpage: { url: "/privacy" },
};
