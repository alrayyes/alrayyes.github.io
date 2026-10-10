import { describe, expect, test } from "bun:test";
import type { Api, Badge } from "../data/apis";
import type { OtherRepo } from "../data/repos";
import {
  CI_FILTERS,
  directoryGroups,
  directoryRows,
  filterRows,
  flatten,
  licences,
} from "./repoDirectory";

const reports = (name: string) => ({
  lighthouse: `https://apis.ryankes.eu/${name}/reports/lighthouse/`,
  tests: `https://apis.ryankes.eu/${name}/reports/tests/junit.xml`,
  coverage: `https://apis.ryankes.eu/${name}/reports/coverage/`,
  coverageXml: `https://apis.ryankes.eu/${name}/reports/coverage/coverage.xml`,
});

const badge = (kind: Badge["kind"], name: string): Badge => ({
  kind,
  label: kind,
  image: `https://img.example.test/${name}/${kind}.svg`,
  href: `https://example.test/${name}/${kind}`,
});

const apis: Api[] = [
  {
    name: "hush-hush",
    description: "Secrets.",
    repo: "https://github.com/alrayyes/Hush-Hush",
    spec: "https://example.test/openapi.yaml",
    docs: "https://example.test/docs",
    reports: reports("Hush-Hush"),
    license: "GPL-3.0",
    badges: [badge("ci", "Hush-Hush"), badge("license", "Hush-Hush")],
    sdks: [
      {
        language: "Go",
        repo: "https://github.com/alrayyes/hush-hush-go",
        docs: "https://example.test/go",
        reports: { coverage: "https://apis.ryankes.eu/hush-hush-go/reports/coverage/" },
        license: "MIT",
        badges: [badge("coverage", "hush-hush-go")],
      },
    ],
  },
];

const others: OtherRepo[] = [
  {
    name: "scaffold-go-api",
    kind: "Scaffold",
    repo: "https://github.com/alrayyes/scaffold-go-api",
    reports: reports("scaffold-go-api"),
    license: "Unlicensed",
    badges: [],
  },
  {
    name: "bun-with-git",
    kind: "Docker image",
    repo: "https://github.com/alrayyes/bun-with-git",
    reports: {},
    license: "MIT",
    badges: [badge("ci", "bun-with-git"), badge("license", "bun-with-git")],
  },
  {
    name: "alrayyes.github.io",
    kind: "This site",
    repo: "https://github.com/alrayyes/alrayyes.github.io",
    reports: {},
    license: "GPL-3.0-or-later",
    badges: [badge("ci", "site")],
  },
];

const rows = directoryRows({ pages: ["/src/pages/index.astro"], apis, others });
const byName = (name: string) => flatten(rows).find((row) => row.name === name);

describe("directoryRows", () => {
  test("sorts every repo A to Z, ignoring case", () => {
    expect(rows.map((row) => row.name)).toEqual([
      "alrayyes.github.io",
      "bun-with-git",
      "Hush-Hush",
      "scaffold-go-api",
    ]);
  });

  test("nests an API's SDKs under it", () => {
    expect(byName("Hush-Hush")?.sdks.map((sdk) => sdk.name)).toEqual(["hush-hush-go"]);
    expect(rows.map((row) => row.name)).not.toContain("hush-hush-go");
  });

  test("keeps an SDK whose API has no row in the list", () => {
    const orphan = directoryRows({
      pages: [],
      apis: [{ ...apis[0], reports: undefined }],
      others: [],
    });
    expect(orphan.map((row) => row.name)).toContain("hush-hush-go");
  });

  test("lists a repo that publishes no reports, with its badges and no report links", () => {
    expect(byName("bun-with-git")).toMatchObject({
      kind: "Other",
      license: "MIT",
      hasCi: true,
      lighthouse: undefined,
      tests: undefined,
      coverage: undefined,
      raw: [],
    });
    expect(byName("bun-with-git")?.badges).toHaveLength(2);
  });

  test("lists each repo once", () => {
    expect(new Set(rows.map((row) => row.name)).size).toBe(rows.length);
  });

  test("maps kinds onto API, SDK, Scaffold and Other", () => {
    expect(flatten(rows).map((row) => row.kind)).toEqual([
      "Other",
      "Other",
      "API",
      "SDK",
      "Scaffold",
    ]);
  });

  test("sends the human-readable reports to the repo's own report page", () => {
    const row = byName("Hush-Hush");
    expect(row?.lighthouse).toBe("/reports/Hush-Hush/lighthouse/");
    expect(row?.tests).toBe("/reports/Hush-Hush/tests/");
  });

  test("leaves out the human-readable link for a report a repo doesn't publish", () => {
    const row = byName("hush-hush-go");
    expect(row?.lighthouse).toBeUndefined();
    expect(row?.tests).toBeUndefined();
  });

  test("keeps coverage and the raw files as secondary links", () => {
    const row = byName("Hush-Hush");
    expect(row?.coverage).toBe("https://apis.ryankes.eu/Hush-Hush/reports/coverage/");
    expect(row?.raw).toEqual([
      {
        label: "junit.xml",
        format: "JUnit XML",
        href: "https://apis.ryankes.eu/Hush-Hush/reports/tests/junit.xml",
      },
      {
        label: "coverage.xml",
        format: "XML",
        href: "https://apis.ryankes.eu/Hush-Hush/reports/coverage/coverage.xml",
      },
    ]);
  });

  test("carries an API's spec and docs, and an SDK's docs", () => {
    expect(byName("Hush-Hush")).toMatchObject({
      spec: "https://example.test/openapi.yaml",
      docs: "https://example.test/docs",
    });
    expect(byName("hush-hush-go")?.docs).toBe("https://example.test/go");
    expect(byName("scaffold-go-api")?.spec).toBeUndefined();
  });

  test("links this site's own Lighthouse and test reports to its report page too", () => {
    expect(byName("alrayyes.github.io")).toMatchObject({
      lighthouse: "/reports/alrayyes.github.io/lighthouse/",
      tests: "/reports/alrayyes.github.io/tests/",
    });
  });
});

describe("badges and licence", () => {
  test("carries a repo's badges in order, and its licence", () => {
    expect(byName("Hush-Hush")?.badges.map((b) => b.kind)).toEqual(["ci", "license"]);
    expect(byName("Hush-Hush")?.license).toBe("GPL-3.0");
    expect(byName("hush-hush-go")?.license).toBe("MIT");
  });

  test("takes this site's badges from its own entry in the repos list", () => {
    expect(byName("alrayyes.github.io")).toMatchObject({ license: "GPL-3.0-or-later" });
    expect(byName("alrayyes.github.io")?.badges).toHaveLength(1);
  });

  test("a repo has CI when it has a ci badge", () => {
    expect(byName("Hush-Hush")?.hasCi).toBe(true);
    expect(byName("hush-hush-go")?.hasCi).toBe(false);
    expect(byName("scaffold-go-api")?.hasCi).toBe(false);
  });

  test("lists each licence once, A to Z, for the licence filter", () => {
    expect(licences(flatten(rows))).toEqual(["GPL-3.0", "GPL-3.0-or-later", "MIT", "Unlicensed"]);
  });
});

describe("filterRows", () => {
  test("matches the name as a case-insensitive substring", () => {
    expect(filterRows(flatten(rows), "HUSH", "All").map((row) => row.name)).toEqual([
      "Hush-Hush",
      "hush-hush-go",
    ]);
  });

  test("narrows by kind, and combines with the text", () => {
    expect(filterRows(flatten(rows), "", "SDK").map((row) => row.name)).toEqual(["hush-hush-go"]);
    expect(filterRows(flatten(rows), "scaffold", "SDK")).toEqual([]);
  });

  test("filters by CI badge", () => {
    expect(CI_FILTERS).toEqual(["Any", "Has CI badge", "No CI badge"]);
    const names = (ci: (typeof CI_FILTERS)[number]) =>
      filterRows(flatten(rows), "", "All", { ci }).map((row) => row.name);
    expect(names("Has CI badge")).toEqual(["alrayyes.github.io", "bun-with-git", "Hush-Hush"]);
    expect(names("No CI badge")).toEqual(["hush-hush-go", "scaffold-go-api"]);
    expect(names("Any")).toHaveLength(5);
  });

  test("filters by licence, and combines with text, kind and CI", () => {
    const run = (text: string, kind: "All" | "SDK", options: Parameters<typeof filterRows>[3]) =>
      filterRows(flatten(rows), text, kind, options).map((row) => row.name);
    expect(run("", "All", { license: "MIT" })).toEqual(["bun-with-git", "hush-hush-go"]);
    expect(run("", "All", { license: "Any" })).toHaveLength(5);
    expect(run("", "SDK", { license: "GPL-3.0" })).toEqual([]);
    expect(run("hush", "All", { license: "GPL-3.0", ci: "Has CI badge" })).toEqual(["Hush-Hush"]);
  });

  test("ignores surrounding whitespace and returns everything for an empty filter", () => {
    expect(filterRows(flatten(rows), "  ", "All")).toEqual(flatten(rows));
  });
});

describe("directoryGroups", () => {
  test("groups by first letter, then puts every scaffold in one Scaffolding group", () => {
    expect(directoryGroups(rows).map((group) => [group.label, group.rows.length])).toEqual([
      ["A", 1],
      ["B", 1],
      ["H", 1],
      ["Scaffolding", 1],
    ]);
  });
});
