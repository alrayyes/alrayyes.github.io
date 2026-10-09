// What the front page lists: one row per repo that publishes reports, sorted
// A to Z, each API followed by its SDKs. Pure functions over the catalogue, so the page only renders. The
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
  // An API's SDKs, listed under it. Empty for every other kind.
  sdks: DirectoryRow[];
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

// SDK repo name -> the API repo it belongs to.
function sdkParents(apis: Api[]): Map<string, string> {
  const parents = new Map<string, string>();
  for (const api of apis) {
    for (const sdk of api.sdks) parents.set(repoName(sdk.repo), repoName(api.repo));
  }
  return parents;
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
  const parents = sdkParents(apis);
  const all = reportSections({ pages, apis, others })
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
        sdks: [],
      };
    })
    .sort(byName);

  // An SDK sits under its API when that API has a row of its own; otherwise
  // it stays in the list so it isn't lost.
  const names = new Set(all.map((row) => row.name));
  const top: DirectoryRow[] = [];
  for (const row of all) {
    const parent = parents.get(row.name);
    if (parent && names.has(parent)) all.find((other) => other.name === parent)?.sdks.push(row);
    else top.push(row);
  }
  return top;
}

// Every row, SDKs included, in display order.
export const flatten = (rows: DirectoryRow[]): DirectoryRow[] =>
  rows.flatMap((row) => [row, ...row.sdks]);

export function filterRows<T extends { name: string; kind: string }>(
  rows: T[],
  text: string,
  kind: KindFilter,
): T[] {
  const needle = text.trim().toLowerCase();
  return rows.filter(
    (row) => row.name.toLowerCase().includes(needle) && (kind === "All" || row.kind === kind),
  );
}

export const SCAFFOLDING = "Scaffolding";

// A to Z letter groups for everything but the scaffolds, which sit together in
// one "Scaffolding" group at the end.
export function directoryGroups(rows: DirectoryRow[]): { label: string; rows: DirectoryRow[] }[] {
  const groups: { label: string; rows: DirectoryRow[] }[] = [];
  for (const row of rows.filter((row) => row.kind !== "Scaffold")) {
    const label = row.name.charAt(0).toUpperCase();
    const last = groups[groups.length - 1];
    if (last?.label === label) last.rows.push(row);
    else groups.push({ label, rows: [row] });
  }
  const scaffolds = rows.filter((row) => row.kind === "Scaffold");
  if (scaffolds.length > 0) groups.push({ label: SCAFFOLDING, rows: scaffolds });
  return groups;
}
