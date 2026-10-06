import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

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
  ...over,
});

test("the repos list matches its JSON Schema", () => {
  const ok = validate(read("src/data/repos.json"));
  expect(validate.errors ?? []).toEqual([]);
  expect(ok).toBe(true);
});

test("the schema accepts a repo with a report link", () => {
  expect(validate({ repos: [repo()] })).toBe(true);
});

test("the schema rejects a repo with no name", () => {
  const { name: _name, ...nameless } = repo();
  expect(validate({ repos: [nameless] })).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "name" });
});

test("the schema rejects a repo with no reports, since that is all this list is for", () => {
  const { reports: _reports, ...bare } = repo();
  expect(validate({ repos: [bare] })).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "reports" });
});

test("the schema rejects a report link that isn't https", () => {
  expect(validate({ repos: [repo({ reports: { coverage: "http://apis.ryankes.eu/x/" } })] })).toBe(
    false,
  );
  expect(validate.errors?.map((e) => e.instancePath)).toContain("/repos/0/reports/coverage");
});

test("the schema rejects a report type it doesn't know", () => {
  expect(validate({ repos: [repo({ reports: { mutation: "https://apis.ryankes.eu/x/" } })] })).toBe(
    false,
  );
});
