// What each story of RepoReportHeader renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import { reportSection } from "../../.storybook/sample";
import type { StoryState } from "../../scripts/render-stories";
import Component from "./RepoReportHeader.astro";

export { Component };

export const states: Record<string, StoryState> = {
  Default: { props: { section: reportSection } },
};
