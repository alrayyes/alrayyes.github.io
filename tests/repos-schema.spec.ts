import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { groupProblems } from "../src/lib/repoGroups";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

// repos.schema.json reuses the `reports` shape from the catalogue's schema, so
// the two can't drift: it is added by its $id and referenced from there.
const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
ajv.addSchema(read("src/data/apis.schema.json"));
const validate = ajv.compile(read("src/data/repos.schema.json"));

const repo = (over: Record<string, unknown> = {}) => ({
  name: "scaffold-x",
  kind: "Scaffold",
  repo: "https://github.com/alrayyes/scaffold-x",
  reports: { coverage: "https://apis.ryankes.eu/scaffold-x/reports/coverage/" },
  license: "Unlicensed",
  badges: [],
  ...over,
});

test("the repos list matches its JSON Schema", () => {
  const ok = validate(read("src/data/repos.json"));
  expect(validate.errors ?? []).toEqual([]);
  expect(ok).toBe(true);
});

test("the schema accepts a repo with a report link", () => {
  expect(validate({ groups: [], repos: [repo()] })).toBe(true);
});

test("the schema rejects a repo with no name", () => {
  const { name: _name, ...nameless } = repo();
  expect(validate({ groups: [], repos: [nameless] })).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "name" });
});

test("the schema rejects a repo with no reports, since that is all this list is for", () => {
  const { reports: _reports, ...bare } = repo();
  expect(validate({ groups: [], repos: [bare] })).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "reports" });
});

test("the schema rejects a report link that isn't https", () => {
  expect(
    validate({ groups: [], repos: [repo({ reports: { coverage: "http://apis.ryankes.eu/x/" } })] }),
  ).toBe(false);
  expect(validate.errors?.map((e) => e.instancePath)).toContain("/repos/0/reports/coverage");
});

test("the schema rejects a report type it doesn't know", () => {
  expect(
    validate({
      groups: [],
      repos: [repo({ reports: { mutation: "https://apis.ryankes.eu/x/" } })],
    }),
  ).toBe(false);
});

test("the schema requires a licence and badges on a repo", () => {
  const { license: _l, badges: _b, ...bare } = repo();
  expect(validate({ groups: [], repos: [bare] })).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "license" });
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "badges" });
});

test("the schema checks a repo's badges against the shared badge shape", () => {
  const ci = {
    kind: "ci",
    label: "CI",
    image: "https://github.com/alrayyes/scaffold-x/actions/workflows/ci.yml/badge.svg",
    href: "https://github.com/alrayyes/scaffold-x/actions/workflows/ci.yml",
  };
  expect(validate({ groups: [], repos: [repo({ badges: [ci] })] })).toBe(true);
  expect(validate({ groups: [], repos: [repo({ badges: [{ ...ci, kind: "vibes" }] })] })).toBe(
    false,
  );
});

test("the schema accepts a repo with no reports of its own, such as this site", () => {
  expect(validate({ groups: [], repos: [repo({ reports: {} })] })).toBe(true);
});

test("every repo's group is declared and every group has a member", () => {
  const { groups, repos } = read("src/data/repos.json");
  expect(groupProblems(groups, repos)).toEqual([]);
});

test("the schema accepts a group and a repo that joins it", () => {
  const group = { id: "washy-washy", title: "washy-washy", type: "product" };
  expect(validate({ groups: [group], repos: [repo({ group: "washy-washy" })] })).toBe(true);
});

test("the schema rejects a group type it doesn't know", () => {
  const group = { id: "x", title: "x", type: "family" };
  expect(validate({ groups: [group], repos: [repo()] })).toBe(false);
});
