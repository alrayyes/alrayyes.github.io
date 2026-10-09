import { describe, expect, test } from "bun:test";
import { ASSERTED, failingInsights } from "./lighthouse-insights";

const report = (scores: Record<string, number | null>) => ({
  audits: Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { score }])),
});

describe("failingInsights", () => {
  test("is empty when every asserted insight scores 1", () => {
    const scores = Object.fromEntries(ASSERTED.map((id) => [id, 1]));
    expect(failingInsights(report(scores))).toEqual([]);
  });

  test("names each asserted insight that scores below 1", () => {
    const scores = Object.fromEntries(ASSERTED.map((id) => [id, 1]));
    scores["render-blocking-insight"] = 0;
    expect(failingInsights(report(scores))).toEqual(["render-blocking-insight"]);
  });

  test("skips an insight that isn't applicable or isn't in the report", () => {
    expect(failingInsights(report({ "render-blocking-insight": null }))).toEqual([]);
  });

  test("leaves the cache and latency insights alone, which GitHub Pages decides", () => {
    expect(ASSERTED).not.toContain("cache-insight");
    expect(ASSERTED).not.toContain("document-latency-insight");
  });
});
