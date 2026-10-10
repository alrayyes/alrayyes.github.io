// What the front page lists: one row per repo that publishes reports, sorted
// A to Z, each API followed by its SDKs. Pure functions over the catalogue, so the page only renders. The
// human-readable reports (Lighthouse, test results) are the primary links and
// go to the repo's own /reports/<repo>/ page, which reads whatever the repo
// publishes and shows it the same way for every repo; coverage and the raw
// XML and LCOV files are secondary.
import type { CiStatus } from "../../scripts/ci-status";
import type { Api, Badge } from "../data/apis";
import type { OtherRepo } from "../data/repos";
import type { GroupType, RepoGroup } from "./repoGroups";
import { repoName, reportSections } from "./reportsIndex";

export const KINDS = ["All", "API", "SDK", "Scaffold", "Other"] as const;
export type KindFilter = (typeof KINDS)[number];
type RepoKind = Exclude<KindFilter, "All">;

export type { CiStatus };

export const CI_FILTERS = ["Any", "Passing", "Failing", "Has CI badge", "No CI badge"] as const;
export type CiFilter = (typeof CI_FILTERS)[number];

// The licence filter's "everything" value; every other value is a licence in
// the data.
export const ANY_LICENCE = "Any";

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
  // The badges from the repo's README, in README order.
  badges: Badge[];
  license: string;
  hasCi: boolean;
  // The result of the newest completed CI run, from the build-time snapshot.
  ciStatus: CiStatus;
  // The id of the group repos.json puts this repo in, if any.
  group?: string;
  // An API's SDKs, listed under it. Empty for every other kind.
  sdks: DirectoryRow[];
}

const UNKNOWN_LICENCE = "Unlicensed";

const kindOf = (kind: string): RepoKind =>
  kind === "API" || kind === "SDK" || kind === "Scaffold" ? kind : "Other";

interface Known {
  spec?: string;
  docs?: string;
  badges: Badge[];
  license: string;
  group?: string;
}

// A repo's own spec, docs, badges and licence, from the entry that names it.
function knownAbout(apis: Api[], others: OtherRepo[]): Map<string, Known> {
  const known = new Map<string, Known>();
  for (const other of others) {
    known.set(repoName(other.repo), {
      badges: other.badges,
      license: other.license,
      group: other.group,
    });
  }
  for (const api of apis) {
    const { badges, license } = api;
    known.set(repoName(api.repo), {
      spec: api.spec,
      docs: api.docs,
      badges,
      license,
      group: api.group,
    });
    for (const sdk of api.sdks) {
      const { badges, license } = sdk;
      known.set(repoName(sdk.repo), { docs: sdk.docs, badges, license });
    }
  }
  return known;
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
  ciStatus = {},
}: {
  pages: string[];
  apis: Api[];
  others: OtherRepo[];
  ciStatus?: Record<string, CiStatus>;
}): DirectoryRow[] {
  const known = knownAbout(apis, others);
  const parents = sdkParents(apis);
  const all = reportSections({ pages, apis, others })
    .map((section): DirectoryRow => {
      const detail = `/reports/${section.name}/`;
      const inGroup = (group: string) => section.files.filter((file) => file.group === group);
      const { badges = [], license = UNKNOWN_LICENCE, ...links } = known.get(section.name) ?? {};
      return {
        name: section.name,
        kind: kindOf(section.kind),
        repo: section.repo,
        ...links,
        badges,
        license,
        hasCi: badges.some((badge) => badge.kind === "ci"),
        ciStatus: ciStatus[section.name] ?? "unknown",
        lighthouse: inGroup("Lighthouse").length > 0 ? `${detail}lighthouse/` : undefined,
        tests: inGroup("Tests").length > 0 ? `${detail}tests/` : undefined,
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

// Each licence in the data once, A to Z, for the licence filter.
export const licences = (rows: { license: string }[]): string[] =>
  [...new Set(rows.map((row) => row.license))].sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" }),
  );

function matchesCi(row: { hasCi?: boolean; ciStatus?: CiStatus }, ci: CiFilter): boolean {
  if (ci === "Any") return true;
  if (ci === "Passing") return row.ciStatus === "passing";
  if (ci === "Failing") return row.ciStatus === "failing";
  return (ci === "Has CI badge") === row.hasCi;
}

export function filterRows<
  T extends {
    name: string;
    kind: string;
    hasCi?: boolean;
    ciStatus?: CiStatus;
    license?: string;
  },
>(
  rows: T[],
  text: string,
  kind: KindFilter,
  { ci = "Any", license = ANY_LICENCE }: { ci?: CiFilter; license?: string } = {},
): T[] {
  const needle = text.trim().toLowerCase();
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(needle) &&
      (kind === "All" || row.kind === kind) &&
      matchesCi(row, ci) &&
      (license === ANY_LICENCE || row.license === license),
  );
}

export interface DirectorySection {
  type: GroupType | "api" | "other";
  title: string;
  description?: string;
  rows: DirectoryRow[];
}

export const OTHER_TITLE = "Everything else";

// What the page shows, in order: a card per API, then each product or scaffolds
// group repos.json declares, in the order it declares them, then every repo in
// none. Which group a repo is in comes from the data alone. An API that names
// an `api` group shares its card with the repos that name it too.
export function directorySections(rows: DirectoryRow[], groups: RepoGroup[]): DirectorySection[] {
  const apiGroups = new Map(groups.filter((g) => g.type === "api").map((g) => [g.id, g]));
  const sections: DirectorySection[] = rows
    .filter((row) => row.sdks.length > 0)
    .map((row) => {
      const group = row.group ? apiGroups.get(row.group) : undefined;
      const joined = group ? rows.filter((other) => other !== row && other.group === group.id) : [];
      return {
        type: "api",
        title: group?.title ?? row.name,
        description: group?.description,
        rows: [row, ...joined],
      };
    });
  for (const { id, title, type, description } of groups) {
    if (type === "api") continue;
    const members = rows.filter((row) => row.group === id);
    if (members.length > 0) sections.push({ type, title, description, rows: members });
  }
  const placed = new Set(sections.flatMap((section) => section.rows));
  const rest = rows.filter((row) => !placed.has(row));
  if (rest.length > 0) sections.push({ type: "other", title: OTHER_TITLE, rows: rest });
  return sections;
}
