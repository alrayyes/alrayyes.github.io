// What the Reports page lists: one section per repo, each with the report
// files it publishes. Pure functions over the catalogue's `reports` entries,
// so the page itself only renders.
import type { Api } from "../data/apis";
import type { OtherRepo } from "../data/repos";
import type { Reports } from "./reportLinks";

export type ReportGroup = "Tests" | "Coverage" | "Lighthouse";

export interface ReportFile {
  group: ReportGroup;
  label: string;
  format: "HTML" | "XML" | "JUnit XML" | "LCOV";
  href: string;
}

export interface RepoSection {
  name: string;
  kind: string;
  repo: string;
  files: ReportFile[];
}

const fileName = (url: string) => url.split("/").pop() ?? url;

// A tests link to a directory is the runner's HTML view; one to a file is
// JUnit XML. The catalogue holds whichever the repo publishes.
export function reportFiles(reports: Reports | undefined): ReportFile[] {
  if (!reports) return [];
  const files: ReportFile[] = [];
  if (reports.tests) {
    const isFile = reports.tests.endsWith(".xml");
    files.push({
      group: "Tests",
      label: isFile ? fileName(reports.tests) : "Test results",
      format: isFile ? "JUnit XML" : "HTML",
      href: reports.tests,
    });
  }
  if (reports.coverage) {
    files.push({ group: "Coverage", label: "HTML view", format: "HTML", href: reports.coverage });
  }
  if (reports.coverageXml) {
    files.push({
      group: "Coverage",
      label: fileName(reports.coverageXml),
      format: "XML",
      href: reports.coverageXml,
    });
  }
  if (reports.lighthouse) {
    files.push({
      group: "Lighthouse",
      label: "Lighthouse",
      format: "HTML",
      href: reports.lighthouse,
    });
  }
  return files;
}

export function repoName(url: string): string {
  return url.replace(/\/+$/, "").split("/").pop() ?? url;
}

// Every API and SDK that publishes reports, the API ahead of its SDKs.
export function catalogueRepos(apis: Api[]): RepoSection[] {
  const sections: RepoSection[] = [];
  for (const api of apis) {
    const entries = [
      { name: repoName(api.repo), kind: "API", repo: api.repo, reports: api.reports },
      ...api.sdks.map((sdk) => ({
        name: repoName(sdk.repo),
        kind: "SDK",
        repo: sdk.repo,
        reports: sdk.reports,
      })),
    ];
    for (const { reports, ...entry } of entries) {
      const files = reportFiles(reports);
      if (files.length > 0) sections.push({ ...entry, files });
    }
  }
  return sections;
}

// The pages Lighthouse audits are the site's own routes: src/pages/index.astro
// is "home", src/pages/privacy.astro is "privacy", and so on. Sorted, the
// home page first.
export function lighthousePages(pageFiles: string[]): string[] {
  const names = pageFiles.map((file) => {
    const route = file.replace(/^.*\/pages\//, "").replace(/\.astro$/, "");
    const name = route.replace(/\/?index$/, "").replaceAll("/", "-");
    return name === "" ? "home" : name;
  });
  return [...new Set(names)].sort((a, b) =>
    a === "home" ? -1 : b === "home" ? 1 : a.localeCompare(b),
  );
}

const SITE_REPO = "https://github.com/alrayyes/alrayyes.github.io";

// This site's own reports, listed file by file. The paths are the ones
// scripts/assemble-reports.ts writes, served at /reports/ because this is the
// user site and has no repo-name prefix.
export function siteSection(pageFiles: string[]): RepoSection {
  const reports = "/reports";
  const files: ReportFile[] = [
    { group: "Tests", label: "unit.xml", format: "JUnit XML", href: `${reports}/tests/unit.xml` },
    {
      group: "Tests",
      label: "playwright.xml",
      format: "JUnit XML",
      href: `${reports}/tests/playwright.xml`,
    },
    {
      group: "Tests",
      label: "Playwright report",
      format: "HTML",
      href: `${reports}/tests/playwright/`,
    },
    { group: "Coverage", label: "HTML view", format: "HTML", href: `${reports}/coverage/` },
    {
      group: "Coverage",
      label: "coverage.xml",
      format: "XML",
      href: `${reports}/coverage/coverage.xml`,
    },
    {
      group: "Coverage",
      label: "lcov.info",
      format: "LCOV",
      href: `${reports}/coverage/lcov.info`,
    },
    ...lighthousePages(pageFiles).map((page) => ({
      group: "Lighthouse" as const,
      label: page.charAt(0).toUpperCase() + page.slice(1).replaceAll("-", " "),
      format: "HTML" as const,
      href: `${reports}/lighthouse/${page}.report.html`,
    })),
  ];
  return { name: "alrayyes.github.io", kind: "This site", repo: SITE_REPO, files };
}

// Every repo that publishes reports: this site, then the catalogue's APIs and
// SDKs, then repos that aren't APIs. A repo named twice appears once.
export function reportSections({
  pages,
  apis,
  others,
}: {
  pages: string[];
  apis: Api[];
  others: OtherRepo[];
}): RepoSection[] {
  const sections = [
    siteSection(pages),
    ...catalogueRepos(apis),
    ...others.map((other) => ({
      name: other.name,
      kind: other.kind,
      repo: other.repo,
      files: reportFiles(other.reports),
    })),
  ];
  const seen = new Set<string>();
  return sections.filter((section) => {
    if (seen.has(section.name)) return false;
    seen.add(section.name);
    return true;
  });
}
