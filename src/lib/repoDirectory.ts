// What the front page lists: one row per repo that publishes reports, sorted
// A to Z. Pure functions over the catalogue, so the page only renders. The
// human-readable reports (Lighthouse, test results) are the primary links and
// go to the repo's own /reports/<repo>/ page, which reads whatever the repo
// publishes and shows it the same way for every repo; coverage and the raw
// XML and LCOV files are secondary.
import type { Api } from "../data/apis";
import type { OtherRepo } from "../data/repos";
import { repoName, reportSections } from "./reportsIndex";

export const KINDS = ["All", "API", "SDK", "Scaffold", "Other"] as const;
export type KindFilter = (typeof KINDS)[number];
type RepoKind = Exclude<KindFilter, "All">;

export interface RawFile {
  label: string;
  format: string;
  href: string;
}

export interface DirectoryRow {
  name: string;
  kind: RepoKind;
  repo: string;
  spec?: string;
  docs?: string;
  lighthouse?: string;
  tests?: string;
  coverage?: string;
  raw: RawFile[];
}

const kindOf = (kind: string): RepoKind =>
  kind === "API" || kind === "SDK" || kind === "Scaffold" ? kind : "Other";

// A repo's own spec and docs, from the catalogue entry that names it.
function catalogueLinks(apis: Api[]): Map<string, { spec?: string; docs?: string }> {
  const links = new Map<string, { spec?: string; docs?: string }>();
  for (const api of apis) {
    links.set(repoName(api.repo), { spec: api.spec, docs: api.docs });
    for (const sdk of api.sdks) links.set(repoName(sdk.repo), { docs: sdk.docs });
  }
  return links;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" });

export function directoryRows({
  pages,
  apis,
  others,
}: {
  pages: string[];
  apis: Api[];
  others: OtherRepo[];
}): DirectoryRow[] {
  const links = catalogueLinks(apis);
  return reportSections({ pages, apis, others })
    .map((section): DirectoryRow => {
      const detail = `/reports/${section.name}/`;
      const inGroup = (group: string) => section.files.filter((file) => file.group === group);
      return {
        name: section.name,
        kind: kindOf(section.kind),
        repo: section.repo,
        ...links.get(section.name),
        lighthouse: inGroup("Lighthouse").length > 0 ? detail : undefined,
        tests: inGroup("Tests").length > 0 ? detail : undefined,
        coverage: inGroup("Coverage").find((file) => file.format === "HTML")?.href,
        raw: section.files
          .filter((file) => file.format !== "HTML")
          .map(({ label, format, href }) => ({ label, format, href })),
      };
    })
    .sort(byName);
}

export function filterRows(rows: DirectoryRow[], text: string, kind: KindFilter): DirectoryRow[] {
  const needle = text.trim().toLowerCase();
  return rows.filter(
    (row) => row.name.toLowerCase().includes(needle) && (kind === "All" || row.kind === kind),
  );
}

export function letterGroups(rows: DirectoryRow[]): { letter: string; rows: DirectoryRow[] }[] {
  const groups: { letter: string; rows: DirectoryRow[] }[] = [];
  for (const row of rows) {
    const letter = row.name.charAt(0).toUpperCase();
    const last = groups[groups.length - 1];
    if (last?.letter === letter) last.rows.push(row);
    else groups.push({ letter, rows: [row] });
  }
  return groups;
}
