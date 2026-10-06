import { describe, expect, test } from "bun:test";
import type { Api } from "../data/apis";
import { catalogueRepos, lighthousePages, repoName, reportFiles } from "./reportsIndex";

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
        label: "Test results",
        format: "JUnit XML",
        href: `${base}/tests/junit.xml`,
      },
      { group: "Coverage", label: "Coverage", format: "HTML", href: `${base}/coverage/` },
      {
        group: "Coverage",
        label: "Coverage (Cobertura XML)",
        format: "XML",
        href: `${base}/coverage/coverage.xml`,
      },
      { group: "Lighthouse", label: "Lighthouse", format: "HTML", href: `${base}/lighthouse/` },
    ]);
  });

  test("calls a tests link that is a directory an HTML view, not JUnit XML", () => {
    const [tests] = reportFiles({ tests: `${base}/tests/` });
    expect(tests?.format).toBe("HTML");
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
            reports: { tests: `${base}/tests/` },
          },
          { language: "PHP", repo: "https://github.com/alrayyes/svc-sdk-php" },
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
            reports: { coverage: `${base}/coverage/` },
          },
        ],
      }),
    ]);
    expect(sections.map((s) => s.name)).toEqual(["svc-sdk-go"]);
  });
});

describe("lighthousePages", () => {
  test("names each page Lighthouse audits, the home page first", () => {
    expect(
      lighthousePages([
        "../pages/privacy.astro",
        "../pages/index.astro",
        "../pages/changelog.astro",
        "../pages/reports/index.astro",
      ]),
    ).toEqual(["home", "changelog", "privacy", "reports"]);
  });
});
