import { describe, expect, test } from "bun:test";
import {
  directoryLinks,
  directoryOf,
  lighthouseRowsFromFiles,
  lighthouseRowsFromManifest,
  sameOriginPath,
} from "./reportDirectory";

describe("directoryLinks", () => {
  test("reads the file names a directory page links", () => {
    const html = `<!doctype html><h1>Lighthouse</h1><ul>
      <li><a href="e2e.xml">e2e.xml</a></li>
      <li><a href="frontend.xml">frontend.xml</a></li></ul>`;
    expect(directoryLinks(html)).toEqual(["e2e.xml", "frontend.xml"]);
  });

  test("skips the way back up, anchors, other directories and other sites", () => {
    const html = `<a href="../">up</a><a href="./">here</a><a href="#top">top</a>
      <a href="sub/">sub</a><a href="/elsewhere">x</a><a href="https://example.com/a.xml">y</a>
      <a href="unit.xml">unit.xml</a>`;
    expect(directoryLinks(html)).toEqual(["unit.xml"]);
  });

  test("lists a file once and decodes its name", () => {
    const html = `<a href="a%20b.xml">1</a><a href="a%20b.xml">2</a>`;
    expect(directoryLinks(html)).toEqual(["a b.xml"]);
  });

  test("returns nothing for a page with no links", () => {
    expect(directoryLinks("<h1>404</h1>")).toEqual([]);
  });
});

describe("directoryOf", () => {
  test("is the URL itself when it already ends in a slash", () => {
    expect(directoryOf("https://apis.ryankes.eu/x/reports/tests/")).toBe(
      "https://apis.ryankes.eu/x/reports/tests/",
    );
  });

  test("is the parent directory of a file URL", () => {
    expect(directoryOf("https://apis.ryankes.eu/x/reports/tests/junit.xml")).toBe(
      "https://apis.ryankes.eu/x/reports/tests/",
    );
    expect(directoryOf("/reports/tests/unit.xml")).toBe("/reports/tests/");
  });
});

describe("sameOriginPath", () => {
  test("turns an apis.ryankes.eu URL into a path, so it is fetched from wherever the page is served", () => {
    expect(sameOriginPath("https://apis.ryankes.eu/x/reports/tests/a.xml")).toBe(
      "/x/reports/tests/a.xml",
    );
  });

  test("leaves a path and another site's URL as they are", () => {
    expect(sameOriginPath("/reports/tests/a.xml")).toBe("/reports/tests/a.xml");
    expect(sameOriginPath("https://example.com/a.xml")).toBe("https://example.com/a.xml");
  });
});

const run = (url: string, representative: boolean, file: string, perf: number) => ({
  url,
  isRepresentativeRun: representative,
  htmlPath: `/home/runner/work/x/x/.lighthouseci/${file}.report.html`,
  jsonPath: `/home/runner/work/x/x/.lighthouseci/${file}.report.json`,
  summary: { performance: perf, accessibility: 1, "best-practices": 1, seo: 0.92 },
});

describe("lighthouseRowsFromManifest", () => {
  const manifest = [
    run("http://localhost:4191/login", false, "login-1", 0.84),
    run("http://localhost:4191/login", true, "login-2", 0.83),
    run("http://localhost:4191/login", false, "login-3", 0.83),
    run("http://localhost:4191/", true, "home-1", 0.99),
  ];

  test("makes one row per audited page, named for its path and ordered by it", () => {
    expect(lighthouseRowsFromManifest(manifest).map((r) => r.page)).toEqual(["/", "/login"]);
  });

  test("shows the representative run, with the whole-number scores of its four categories", () => {
    const login = lighthouseRowsFromManifest(manifest).find((r) => r.page === "/login");
    expect(login?.representative).toEqual({
      html: "login-2.report.html",
      json: "login-2.report.json",
      scores: { performance: 83, accessibility: 100, "best-practices": 100, seo: 92 },
    });
  });

  test("keeps the other runs behind it, using only the file name of each path", () => {
    const login = lighthouseRowsFromManifest(manifest).find((r) => r.page === "/login");
    expect(login?.others.map((o) => o.html)).toEqual([
      "login-1.report.html",
      "login-3.report.html",
    ]);
  });

  test("takes the first run as the representative one when none is marked", () => {
    const rows = lighthouseRowsFromManifest([
      run("http://localhost/a", false, "a-1", 0.5),
      run("http://localhost/a", false, "a-2", 0.6),
    ]);
    expect(rows[0]?.representative.html).toBe("a-1.report.html");
  });
});

describe("lighthouseRowsFromFiles", () => {
  test("lists each report file without scores when there is no manifest, pairing the JSON when it is there", () => {
    const rows = lighthouseRowsFromFiles([
      "home.report.html",
      "home.report.json",
      "privacy.report.html",
      "assertion-results.json",
    ]);
    expect(rows.map((r) => [r.page, r.representative.html, r.representative.json])).toEqual([
      ["home", "home.report.html", "home.report.json"],
      ["privacy", "privacy.report.html", undefined],
    ]);
    expect(rows[0]?.representative.scores).toBeNull();
  });

  test("names a timestamped Lighthouse CI file for its page and ignores the duplicate lhr files", () => {
    const rows = lighthouseRowsFromFiles([
      "localhost-index_html-2026_10_06_13_50_25.report.html",
      "lhr-1791294384581.html",
    ]);
    expect(rows.map((r) => r.page)).toEqual(["index.html"]);
  });

  test("makes one row of a page's several runs, the newest first and the older ones behind it", () => {
    const rows = lighthouseRowsFromFiles([
      "localhost-login-2026_10_06_13_46_15.report.html",
      "localhost-login-2026_10_06_13_46_39.report.html",
      "localhost-login-2026_10_06_13_46_28.report.html",
      "localhost-home-2026_10_06_13_46_15.report.html",
    ]);
    expect(rows.map((r) => r.page)).toEqual(["home", "login"]);
    const login = rows.find((r) => r.page === "login");
    expect(login?.representative.html).toBe("localhost-login-2026_10_06_13_46_39.report.html");
    expect(login?.others.map((o) => o.html)).toEqual([
      "localhost-login-2026_10_06_13_46_28.report.html",
      "localhost-login-2026_10_06_13_46_15.report.html",
    ]);
  });
});
