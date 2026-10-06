// What the Reports page lists: one section per repo, each with the report
// files it publishes. Pure functions over the catalogue's `reports` entries,
// so the page itself only renders.
import type { Api } from "../data/apis";
import type { Reports } from "./reportLinks";

export type ReportGroup = "Tests" | "Coverage" | "Lighthouse";

export interface ReportFile {
  group: ReportGroup;
  label: string;
  format: "HTML" | "XML" | "JUnit XML";
  href: string;
}

export interface RepoSection {
  name: string;
  kind: string;
  repo: string;
  files: ReportFile[];
}

// A tests link to a directory is the runner's HTML view; one to a file is
// JUnit XML. The catalogue holds whichever the repo publishes.
export function reportFiles(reports: Reports | undefined): ReportFile[] {
  if (!reports) return [];
  const files: ReportFile[] = [];
  if (reports.tests) {
    files.push({
      group: "Tests",
      label: "Test results",
      format: reports.tests.endsWith(".xml") ? "JUnit XML" : "HTML",
      href: reports.tests,
    });
  }
  if (reports.coverage) {
    files.push({ group: "Coverage", label: "Coverage", format: "HTML", href: reports.coverage });
  }
  if (reports.coverageXml) {
    files.push({
      group: "Coverage",
      label: "Coverage (Cobertura XML)",
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
