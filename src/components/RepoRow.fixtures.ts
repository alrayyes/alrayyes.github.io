// What each story of RepoRow renders: the props, and the page URL where the
// component reads it. Rendered by scripts/render-stories.ts.
import { apiPassing, bare, failing, sdkNode } from "../../.storybook/sample";
import type { StoryState } from "../../scripts/render-stories";
import Component from "./RepoRow.astro";

export { Component };

export const states: Record<string, StoryState> = {
  ApiPassing: { wrap: "ul", props: { row: apiPassing } },
  FailingCi: { wrap: "ul", props: { row: failing } },
  NoReports: { wrap: "ul", props: { row: bare } },
  SdkNested: { wrap: "ul", props: { row: sdkNode, nested: true } },
};
