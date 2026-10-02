import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(read("src/data/apis.schema.json"));

test("the catalogue matches its JSON Schema", () => {
  const ok = validate(read("src/data/apis.json"));
  expect(validate.errors ?? []).toEqual([]);
  expect(ok).toBe(true);
});

test("the schema rejects an API with no repo", () => {
  const broken = {
    apis: [{ name: "x", description: "y", spec: "https://example.com/s", sdks: [] }],
  };
  expect(validate(broken)).toBe(false);
  expect(validate.errors?.map((e) => e.params)).toContainEqual({ missingProperty: "repo" });
});

test("the schema rejects a docs link that isn't a URL", () => {
  const broken = {
    apis: [
      {
        name: "x",
        description: "y",
        repo: "https://example.com/r",
        spec: "https://example.com/s",
        sdks: [{ language: "Go", repo: "https://example.com/g", docs: "not a url" }],
      },
    ],
  };
  expect(validate(broken)).toBe(false);
  expect(validate.errors?.map((e) => e.instancePath)).toContain("/apis/0/sdks/0/docs");
});
