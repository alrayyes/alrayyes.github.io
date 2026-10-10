// Reading a repo's published report directories from the browser. GitHub
// Pages has no directory listing, so a repo's pipeline writes an index page
// that links its files, and Lighthouse CI also writes a manifest. These
// functions turn those into rows; the page does the fetching.

const SITE_HOST = "apis.ryankes.eu";

// The file names a directory's index page links. Anything that isn't a file
// in that directory is left out: the way back up, anchors, sub-directories,
// absolute paths and other sites.
export function directoryLinks(html: string): string[] {
  const names = new Set<string>();
  for (const [, href] of html.matchAll(/<a\s[^>]*href="([^"]*)"/gi)) {
    if (!href || href.startsWith("#") || href.startsWith("/") || href.endsWith("/")) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    names.add(decodeURIComponent(href.split(/[?#]/)[0] ?? href));
  }
  return [...names];
}

// The directory a catalogue link lives in: the link itself when it already
// ends in a slash, its parent when it points at a file.
export function directoryOf(url: string): string {
  return url.endsWith("/") ? url : url.slice(0, url.lastIndexOf("/") + 1);
}

// A report on this site is fetched from wherever the page itself is served,
// so a catalogue URL on apis.ryankes.eu becomes a path. Anything else stays.
export function sameOriginPath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname === SITE_HOST ? parsed.pathname : url;
  } catch {
    return url;
  }
}

// Lighthouse's own bands: 90 and up is good, 50 to 89 needs work, below is poor.
export type ScoreBand = "green" | "amber" | "red";
export const scoreBand = (score: number): ScoreBand =>
  score >= 90 ? "green" : score >= 50 ? "amber" : "red";

export const bandLabel = (score: number) =>
  ({ green: "Good", amber: "Needs improvement", red: "Poor" })[scoreBand(score)];

export type Scores = Record<string, number>;

export interface LighthouseRun {
  html: string;
  json?: string;
  scores: Scores | null;
}

export interface LighthouseRow {
  page: string;
  representative: LighthouseRun;
  others: LighthouseRun[];
}

interface ManifestRun {
  url: string;
  isRepresentativeRun: boolean;
  htmlPath: string;
  jsonPath: string;
  summary: Record<string, number>;
}

const baseName = (path: string) => path.split("/").pop() ?? path;

// One row per audited page. Lighthouse CI's own paths are absolute paths on
// the runner that made them, so only the file name is used.
export function lighthouseRowsFromManifest(manifest: ManifestRun[]): LighthouseRow[] {
  const byPage = new Map<string, ManifestRun[]>();
  for (const entry of manifest) {
    const page = new URL(entry.url).pathname || "/";
    byPage.set(page, [...(byPage.get(page) ?? []), entry]);
  }
  const toRun = (entry: ManifestRun): LighthouseRun => ({
    html: baseName(entry.htmlPath),
    json: baseName(entry.jsonPath),
    scores: Object.fromEntries(
      Object.entries(entry.summary).map(([name, score]) => [name, Math.round(score * 100)]),
    ),
  });
  return [...byPage.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, runs]) => {
      const chosen = runs.find((run) => run.isRepresentativeRun) ?? runs[0];
      return {
        page,
        representative: toRun(chosen as ManifestRun),
        others: runs.filter((run) => run !== chosen).map(toRun),
      };
    });
}

// Without a manifest there are no scores, only the reports a directory lists.
// Lighthouse CI also writes lhr-*.html copies of the same runs, which are left
// out, and names its files <host>-<page>-<timestamp>.report.html. The runs of
// one page become one row, the newest first: the timestamp sorts as text.
export function lighthouseRowsFromFiles(files: string[]): LighthouseRow[] {
  const byPage = new Map<string, LighthouseRun[]>();
  for (const html of files
    .filter((file) => file.endsWith(".report.html"))
    .sort()
    .reverse()) {
    const stem = html.slice(0, -".report.html".length);
    const json = `${stem}.report.json`;
    const page = stem
      .replace(/^localhost-/, "")
      .replace(/-\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}$/, "")
      .replace(/_html$/, ".html");
    const run = { html, json: files.includes(json) ? json : undefined, scores: null };
    byPage.set(page, [...(byPage.get(page) ?? []), run]);
  }
  return [...byPage.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([page, [representative, ...others]]) => ({
      page,
      representative: representative as LighthouseRun,
      others,
    }));
}

// A Lighthouse report's category scores (0 to 1) as whole percentages. A
// category with no score is left out; no categories at all gives null.
export function scoresFromReport(report: unknown): Scores | null {
  const categories = (report as { categories?: Record<string, { score?: number | null }> } | null)
    ?.categories;
  const entries = Object.entries(categories ?? {}).flatMap(([name, { score }]) =>
    typeof score === "number" ? [[name, Math.round(score * 100)] as const] : [],
  );
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

// The rounded mean of each category over the pages' representative runs. The
// other runs are repeats of a page, so counting them would weight a page by how
// often it ran. A category a run lacks is left out of its mean.
export function siteAverage(rows: LighthouseRow[]): Scores | null {
  const sums = new Map<string, { total: number; count: number }>();
  for (const { representative } of rows) {
    for (const [name, score] of Object.entries(representative.scores ?? {})) {
      const sum = sums.get(name) ?? { total: 0, count: 0 };
      sums.set(name, { total: sum.total + score, count: sum.count + 1 });
    }
  }
  if (sums.size === 0) return null;
  return Object.fromEntries(
    [...sums].map(([name, { total, count }]) => [name, Math.round(total / count)]),
  );
}
