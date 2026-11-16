// What each story of ReportSection renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import { reportSection } from "../../.storybook/sample";
import type { StoryState } from "../../scripts/render-stories";
import Component from "./ReportSection.astro";

export { Component };

export const states: Record<string, StoryState> = {
  Lighthouse: { props: { section: reportSection, group: "Lighthouse" } },
  Tests: { props: { section: reportSection, group: "Tests" } },
  Coverage: { props: { section: reportSection, group: "Coverage" } },
};
