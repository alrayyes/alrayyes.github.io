import { describe, expect, test } from "bun:test";
import type { Api } from "../data/apis";
import type { OtherRepo } from "../data/repos";
import { directoryRows, filterRows, letterGroups } from "./repoDirectory";

const reports = (name: string) => ({
  lighthouse: `https://apis.ryankes.eu/${name}/reports/lighthouse/`,
  tests: `https://apis.ryankes.eu/${name}/reports/tests/junit.xml`,
  coverage: `https://apis.ryankes.eu/${name}/reports/coverage/`,
  coverageXml: `https://apis.ryankes.eu/${name}/reports/coverage/coverage.xml`,
});

const apis: Api[] = [
  {
    name: "hush-hush",
    description: "Secrets.",
    repo: "https://github.com/alrayyes/Hush-Hush",
    spec: "https://example.test/openapi.yaml",
    docs: "https://example.test/docs",
    reports: reports("Hush-Hush"),
    sdks: [
      {
        language: "Go",
        repo: "https://github.com/alrayyes/hush-hush-go",
        docs: "https://example.test/go",
        reports: { coverage: "https://apis.ryankes.eu/hush-hush-go/reports/coverage/" },
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
  },
];

const rows = directoryRows({ pages: ["/src/pages/index.astro"], apis, others });
const byName = (name: string) => rows.find((row) => row.name === name);

describe("directoryRows", () => {
  test("sorts every repo A to Z, ignoring case", () => {
    expect(rows.map((row) => row.name)).toEqual([
      "alrayyes.github.io",
      "Hush-Hush",
      "hush-hush-go",
      "scaffold-go-api",
    ]);
  });

  test("lists each repo once", () => {
    expect(new Set(rows.map((row) => row.name)).size).toBe(rows.length);
  });

  test("maps kinds onto API, SDK, Scaffold and Other", () => {
    expect(rows.map((row) => row.kind)).toEqual(["Other", "API", "SDK", "Scaffold"]);
  });

  test("sends the human-readable reports to the repo's own report page", () => {
    const row = byName("Hush-Hush");
    expect(row?.lighthouse).toBe("/reports/Hush-Hush/");
    expect(row?.tests).toBe("/reports/Hush-Hush/");
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
      lighthouse: "/reports/alrayyes.github.io/",
      tests: "/reports/alrayyes.github.io/",
    });
  });
});

describe("filterRows", () => {
  test("matches the name as a case-insensitive substring", () => {
    expect(filterRows(rows, "HUSH", "All").map((row) => row.name)).toEqual([
      "Hush-Hush",
      "hush-hush-go",
    ]);
  });

  test("narrows by kind, and combines with the text", () => {
    expect(filterRows(rows, "", "SDK").map((row) => row.name)).toEqual(["hush-hush-go"]);
    expect(filterRows(rows, "scaffold", "SDK")).toEqual([]);
  });

  test("ignores surrounding whitespace and returns everything for an empty filter", () => {
    expect(filterRows(rows, "  ", "All")).toEqual(rows);
  });
});

describe("letterGroups", () => {
  test("groups sorted rows under the first letter of their name, upper-cased", () => {
    expect(letterGroups(rows).map((group) => [group.letter, group.rows.length])).toEqual([
      ["A", 1],
      ["H", 2],
      ["S", 1],
    ]);
  });
});
