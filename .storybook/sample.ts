// Sample rows for the stories. Made up, but shaped like what
// src/lib/repoDirectory.ts builds from the real catalogue. Badge images are
// data URIs, so a story never asks the network for anything.
import type { Badge } from "../src/data/apis";
import type { DirectoryRow } from "../src/lib/repoDirectory";
import type { RepoSection } from "../src/lib/reportsIndex";

const badgeImage = (colour: string, text: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="90" height="20"><rect width="90" height="20" rx="3" fill="${colour}"/><text x="45" y="14" fill="#fff" font-family="sans-serif" font-size="11" text-anchor="middle">${text}</text></svg>`,
  )}`;

export const badges: Badge[] = [
  {
    kind: "ci",
    label: "CI",
    image: badgeImage("#2e7d32", "ci passing"),
    href: "https://github.com/alrayyes/example/actions",
  },
  {
    kind: "coverage",
    label: "Codecov",
    image: badgeImage("#1565c0", "coverage 94%"),
    href: "https://codecov.io/gh/alrayyes/example",
  },
  {
    kind: "release",
    label: "release",
    image: badgeImage("#6a1b9a", "release v1.4.0"),
    href: "https://github.com/alrayyes/example/releases",
  },
  {
    kind: "license",
    label: "licence",
    image: badgeImage("#455a64", "GPL-3.0"),
    href: "https://github.com/alrayyes/example/blob/main/LICENSE",
  },
];

const base = "https://apis.ryankes.eu/example";

const row = (over: Partial<DirectoryRow>): DirectoryRow => ({
  name: "example-api",
  kind: "API",
  repo: "https://github.com/alrayyes/example-api",
  raw: [],
  badges: [],
  license: "GPL-3.0-or-later",
  ciStatus: "unknown",
  sdks: [],
  ...over,
});

export const sdkNode = row({
  name: "example-api-sdk-node",
  kind: "SDK",
  repo: "https://github.com/alrayyes/example-api-sdk-node",
  tests: "/reports/example-api-sdk-node/tests/",
  coverage: "/reports/example-api-sdk-node/",
  ciStatus: "passing",
  badges: badges.slice(0, 2),
});

export const sdkGo = row({
  name: "example-api-sdk-go",
  kind: "SDK",
  repo: "https://github.com/alrayyes/example-api-sdk-go",
  ciStatus: "failing",
});

export const apiPassing = row({
  spec: `${base}/openapi.yaml`,
  docs: `${base}/docs/`,
  lighthouse: "/reports/example-api/lighthouse/",
  tests: "/reports/example-api/tests/",
  coverage: "/reports/example-api/",
  raw: [
    { label: "unit.xml", format: "JUnit XML", href: `${base}/reports/tests/unit.xml` },
    { label: "lcov.info", format: "LCOV", href: `${base}/reports/coverage/lcov.info` },
  ],
  badges,
  ciStatus: "passing",
  lighthouseScores: { performance: 100, accessibility: 96, "best-practices": 74, seo: 42 },
  sdks: [sdkNode, sdkGo],
});

export const failing = row({
  name: "example-worker",
  kind: "Other",
  repo: "https://github.com/alrayyes/example-worker",
  tests: "/reports/example-worker/tests/",
  ciStatus: "failing",
  badges: badges.slice(0, 1),
});

export const bare = row({
  name: "scaffold-example",
  kind: "Scaffold",
  repo: "https://github.com/alrayyes/scaffold-example",
  license: "Unlicensed",
});

const file = (
  group: "Lighthouse" | "Tests" | "Coverage",
  label: string,
  format: "HTML" | "XML" | "JUnit XML" | "LCOV",
  href: string,
) => ({ group, label, format, href });

export const reportSection: RepoSection = {
  name: "example-api",
  kind: "API",
  repo: "https://github.com/alrayyes/example-api",
  files: [
    file("Lighthouse", "Home", "HTML", `${base}/reports/lighthouse/index.report.html`),
    file("Lighthouse", "Home (JSON)", "XML", `${base}/reports/lighthouse/index.report.json`),
    file("Tests", "Test results", "HTML", `${base}/reports/tests/`),
    file("Tests", "unit.xml", "JUnit XML", `${base}/reports/tests/unit.xml`),
    file("Coverage", "Coverage", "HTML", `${base}/reports/coverage/`),
    file("Coverage", "lcov.info", "LCOV", `${base}/reports/coverage/lcov.info`),
  ],
};
