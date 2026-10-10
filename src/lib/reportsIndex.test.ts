import { describe, expect, test } from "bun:test";
import type { Api } from "../data/apis";
import {
  catalogueRepos,
  lighthousePages,
  repoName,
  reportFiles,
  reportSections,
  siteSection,
} from "./reportsIndex";

const base = "https://apis.ryankes.eu/x/reports";

describe("reportFiles", () => {
  test("describes each published file with its group, label and format", () => {
    expect(
      reportFiles({
        tests: `${base}/tests/junit.xml`,
        coverage: `${base}/coverage/`,
        coverageXml: `${base}/coverage/coverage.xml`,
        lighthouse: `${base}/lighthouse/`,
      }),
    ).toEqual([
      {
        group: "Tests",
        label: "junit.xml",
        format: "JUnit XML",
        href: `${base}/tests/junit.xml`,
      },
      { group: "Coverage", label: "HTML view", format: "HTML", href: `${base}/coverage/` },
      {
        group: "Coverage",
        label: "coverage.xml",
        format: "XML",
        href: `${base}/coverage/coverage.xml`,
      },
      { group: "Lighthouse", label: "Lighthouse", format: "HTML", href: `${base}/lighthouse/` },
    ]);
  });

  test("calls a tests link that is a directory the test results, an HTML view, not JUnit XML", () => {
    const [tests] = reportFiles({ tests: `${base}/tests/` });
    expect(tests).toMatchObject({ label: "Test results", format: "HTML" });
  });

  test("leaves out a report that isn't there, and returns nothing for none", () => {
    expect(reportFiles({ coverage: `${base}/coverage/` }).map((f) => f.group)).toEqual([
      "Coverage",
    ]);
    expect(reportFiles(undefined)).toEqual([]);
    expect(reportFiles({})).toEqual([]);
  });
});

describe("repoName", () => {
  test("is the last segment of the repo URL", () => {
    expect(repoName("https://github.com/alrayyes/forge-dashboard-sdk-go")).toBe(
      "forge-dashboard-sdk-go",
    );
    expect(repoName("https://github.com/alrayyes/Hush-Hush/")).toBe("Hush-Hush");
  });
});

const api = (over: Partial<Api>): Api => ({
  name: "svc",
  description: "d",
  repo: "https://github.com/alrayyes/svc",
  spec: "https://example.com/spec",
  license: "MIT",
  badges: [],
  sdks: [],
  ...over,
});

describe("catalogueRepos", () => {
  test("gives each API and SDK that publishes reports a section of its own, API first", () => {
    const sections = catalogueRepos([
      api({
        reports: { coverage: `${base}/coverage/` },
        sdks: [
          {
            language: "Go",
            repo: "https://github.com/alrayyes/svc-sdk-go",
            license: "MIT",
            badges: [],
            reports: { tests: `${base}/tests/` },
          },
          {
            language: "PHP",
            repo: "https://github.com/alrayyes/svc-sdk-php",
            license: "MIT",
            badges: [],
          },
        ],
      }),
    ]);
    expect(sections.map((s) => [s.name, s.kind])).toEqual([
      ["svc", "API"],
      ["svc-sdk-go", "SDK"],
    ]);
    expect(sections[1]?.repo).toBe("https://github.com/alrayyes/svc-sdk-go");
    expect(sections[1]?.files.map((f) => f.group)).toEqual(["Tests"]);
  });

  test("leaves out an API whose reports aren't published, and keeps its SDKs that are", () => {
    const sections = catalogueRepos([
      api({
        sdks: [
          {
            language: "Go",
            repo: "https://github.com/alrayyes/svc-sdk-go",
            license: "MIT",
            badges: [],
            reports: { coverage: `${base}/coverage/` },
          },
        ],
      }),
    ]);
    expect(sections.map((s) => s.name)).toEqual(["svc-sdk-go"]);
  });
});

describe("lighthousePages", () => {
  test("names each page Lighthouse audits, the home page first, and skips the report pages", () => {
    expect(
      lighthousePages([
        "../pages/privacy.astro",
        "../pages/index.astro",
        "../pages/changelog.astro",
        "../pages/reports/index.astro",
        "../pages/reports/[repo].astro",
      ]),
    ).toEqual(["home", "changelog", "privacy"]);
  });
});

describe("siteSection", () => {
  const section = siteSection([
    "../pages/index.astro",
    "../pages/privacy.astro",
    "../pages/reports/index.astro",
  ]);

  test("is this site's own section, linked to its repo", () => {
    expect(section).toMatchObject({
      name: "alrayyes.github.io",
      kind: "This site",
      repo: "https://github.com/alrayyes/alrayyes.github.io",
    });
  });

  test("lists each test, coverage and Lighthouse file individually, on this site's own paths", () => {
    const hrefs = Object.fromEntries(section.files.map((f) => [f.label, f.href]));
    expect(hrefs["unit.xml"]).toBe("/reports/tests/unit.xml");
    expect(hrefs["playwright.xml"]).toBe("/reports/tests/playwright.xml");
    expect(hrefs["Playwright report"]).toBe("/reports/tests/playwright/");
    expect(hrefs["HTML view"]).toBe("/reports/coverage/");
    expect(hrefs["coverage.xml"]).toBe("/reports/coverage/coverage.xml");
    expect(hrefs["lcov.info"]).toBe("/reports/coverage/lcov.info");
  });

  test("tags lcov.info as LCOV and the Playwright report as HTML", () => {
    const format = (label: string) => section.files.find((f) => f.label === label)?.format;
    expect(format("lcov.info")).toBe("LCOV");
    expect(format("Playwright report")).toBe("HTML");
  });

  test("has one Lighthouse report per page, named for the page", () => {
    const lighthouse = section.files.filter((f) => f.group === "Lighthouse");
    expect(lighthouse.map((f) => [f.label, f.href])).toEqual([
      ["Home", "/reports/lighthouse/home.report.html"],
      ["Privacy", "/reports/lighthouse/privacy.report.html"],
    ]);
  });
});

describe("reportSections", () => {
  const pages = ["../pages/index.astro"];
  const catalogue = [
    api({ reports: { coverage: `${base}/coverage/` }, repo: "https://github.com/alrayyes/svc" }),
  ];
  const other = {
    name: "scaffold-x",
    kind: "Scaffold",
    repo: "https://github.com/alrayyes/scaffold-x",
    reports: { coverage: `${base}/coverage/` },
    license: "Unlicensed",
    badges: [],
  };

  test("puts this site first, then the catalogue's repos, then the others", () => {
    const sections = reportSections({ pages, apis: catalogue, others: [other] });
    expect(sections.map((s) => [s.name, s.kind])).toEqual([
      ["alrayyes.github.io", "This site"],
      ["svc", "API"],
      ["scaffold-x", "Scaffold"],
    ]);
  });

  test("lists a repo once, even when two sources name it", () => {
    const sections = reportSections({
      pages,
      apis: catalogue,
      others: [{ ...other, name: "svc", repo: "https://github.com/alrayyes/svc" }],
    });
    expect(sections.filter((s) => s.name === "svc")).toHaveLength(1);
  });
});
