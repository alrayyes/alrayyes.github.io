import { describe, expect, test } from "bun:test";
import { buildScores, jsonLinks, reportLinks, type Snapshot } from "./lighthouse-repos";

const report = (performance: number) => ({
  categories: {
    performance: { score: performance },
    accessibility: { score: 1 },
    "best-practices": { score: 1 },
    seo: { score: 0.9 },
  },
});

const dir = "https://apis.ryankes.eu/x/reports/lighthouse/";
const index = `<a href="a.report.html">/</a> (<a href="a.report.json">JSON</a>)
<a href="b.report.html">/b</a> (<a href="b.report.json">JSON</a>)`;

describe("jsonLinks", () => {
  test("lists each JSON file an index page links, and nothing else", () => {
    expect(jsonLinks(index)).toEqual(["a.report.json", "b.report.json"]);
    expect(jsonLinks('<a href="home.html">x</a> <a href="home.json">JSON</a>')).toEqual([
      "home.json",
    ]);
  });
});

describe("reportLinks", () => {
  test("names each report's JSON, from the JSON links or else from the HTML ones", () => {
    expect(reportLinks(index)).toEqual(["a.report.json", "b.report.json"]);
    expect(reportLinks('<a href="a.report.html">a</a> <a href="b.report.html">b</a>')).toEqual([
      "a.report.json",
      "b.report.json",
    ]);
  });
});

describe("buildScores", () => {
  const fetchText = (pages: Record<string, unknown>) => async (url: string) => {
    if (!(url in pages)) throw new Error(`404 ${url}`);
    const body = pages[url];
    return typeof body === "string" ? body : JSON.stringify(body);
  };

  test("averages a repo's reports over its audited pages", async () => {
    const snapshot = await buildScores({
      entries: [{ name: "x", lighthouse: dir }],
      fetchText: fetchText({
        [dir]: index,
        [`${dir}a.report.json`]: report(1),
        [`${dir}b.report.json`]: report(0.5),
      }),
    });
    expect(snapshot?.repos.x).toEqual({
      pages: 2,
      scores: { performance: 75, accessibility: 100, "best-practices": 100, seo: 90 },
    });
  });

  test("reads the directory a link to a single report page sits in", async () => {
    const snapshot = await buildScores({
      entries: [{ name: "x", lighthouse: `${dir}report.html` }],
      fetchText: fetchText({
        [dir]: index,
        [`${dir}a.report.json`]: report(1),
        [`${dir}b.report.json`]: report(1),
      }),
    });
    expect(Object.keys(snapshot?.repos ?? {})).toEqual(["x"]);
  });

  test("reads each page's JSON beside its HTML when the index links only HTML", async () => {
    const snapshot = await buildScores({
      entries: [{ name: "x", lighthouse: dir }],
      fetchText: fetchText({
        [dir]: '<a href="a.report.html">a</a> <a href="b.report.html">b</a>',
        [`${dir}a.report.json`]: report(1),
        [`${dir}b.report.json`]: report(0.5),
      }),
    });
    expect(snapshot?.repos.x?.pages).toBe(2);
    expect(snapshot?.repos.x?.scores.performance).toBe(75);
  });

  test("reads the JSON beside a single report page whose directory has no index", async () => {
    const page = `${dir}index/`;
    const snapshot = await buildScores({
      entries: [{ name: "x", lighthouse: `${page}report.html` }],
      fetchText: fetchText({ [`${page}report.json`]: report(1) }),
    });
    expect(snapshot?.repos.x).toEqual({
      pages: 1,
      scores: { performance: 100, accessibility: 100, "best-practices": 100, seo: 90 },
    });
  });

  test("keeps a repo's previous scores when its lookup fails", async () => {
    const previous: Snapshot = {
      repos: { x: { pages: 1, scores: { performance: 80 } }, y: { pages: 1, scores: { seo: 70 } } },
    };
    const snapshot = await buildScores({
      entries: [
        { name: "x", lighthouse: dir },
        { name: "y", lighthouse: "https://apis.ryankes.eu/y/reports/lighthouse/" },
      ],
      fetchText: fetchText({
        [dir]: index,
        [`${dir}a.report.json`]: report(1),
        [`${dir}b.report.json`]: report(1),
      }),
      previous,
    });
    expect(snapshot?.repos.y).toEqual({ pages: 1, scores: { seo: 70 } });
    expect(snapshot?.repos.x?.pages).toBe(2);
  });

  test("returns null when every lookup fails, so the file is left alone", async () => {
    const snapshot = await buildScores({
      entries: [{ name: "x", lighthouse: dir }],
      fetchText: fetchText({}),
    });
    expect(snapshot).toBeNull();
  });
});
