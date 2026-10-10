import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { averageOf } from "./lighthouse-average";

const report = (performance: number) => ({
  categories: {
    performance: { score: performance },
    accessibility: { score: 1 },
    "best-practices": { score: 1 },
    seo: { score: 1 },
  },
});

const dirs: string[] = [];
const reportsDir = (files: Record<string, unknown>) => {
  const dir = mkdtempSync(join(tmpdir(), "lh-"));
  dirs.push(dir);
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), typeof body === "string" ? body : JSON.stringify(body));
  }
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("averageOf", () => {
  test("is the rounded mean of each category over the page reports, with the page count", () => {
    const dir = reportsDir({
      "home.report.json": report(0.97),
      "privacy.report.json": report(0.89),
      "home.report.html": "<html></html>",
    });
    expect(averageOf(dir)).toEqual({
      pages: 2,
      scores: { performance: 93, accessibility: 100, "best-practices": 100, seo: 100 },
    });
  });

  test("skips a report it can't read, and is null when none can be", () => {
    const dir = reportsDir({ "home.report.json": report(1), "bad.report.json": "not json" });
    expect(averageOf(dir)?.pages).toBe(1);
    expect(averageOf(reportsDir({ "bad.report.json": "{" }))).toBeNull();
    expect(averageOf(join(tmpdir(), "no-such-lighthouse-dir"))).toBeNull();
  });
});
