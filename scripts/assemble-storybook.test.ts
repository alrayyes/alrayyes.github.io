import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assembleStorybook, CATALOGUES } from "./assemble-storybook";

const dirs: string[] = [];
const tmp = () => {
  const dir = mkdtempSync(join(tmpdir(), "assemble-storybook-"));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function catalogue(root: string, name: string, stories: number, docs = 0) {
  mkdirSync(join(root, name), { recursive: true });
  const entries = Object.fromEntries([
    ...Array.from({ length: stories }, (_, i) => [`s${i}`, { id: `s${i}`, type: "story" }]),
    ...Array.from({ length: docs }, (_, i) => [`d${i}`, { id: `d${i}`, type: "docs" }]),
  ]);
  writeFileSync(join(root, name, "index.json"), JSON.stringify({ v: 5, entries }));
  writeFileSync(join(root, name, "index.html"), "<html></html>");
}

test("copies each catalogue and writes a landing page linking them", async () => {
  const input = tmp();
  const out = join(tmp(), "storybook");
  for (const { dir } of CATALOGUES) catalogue(input, dir, 2);

  await assembleStorybook(input, out);

  for (const { dir } of CATALOGUES) {
    expect(readFileSync(join(out, dir, "index.json"), "utf8")).toContain("s0");
  }
  const index = readFileSync(join(out, "index.html"), "utf8");
  for (const { dir, label } of CATALOGUES) {
    expect(index).toContain(`href="${dir}/"`);
    expect(index).toContain(label);
  }
});

test("refuses a catalogue that lists no stories", async () => {
  const input = tmp();
  const [first, ...rest] = CATALOGUES;
  catalogue(input, first.dir, 0);
  for (const { dir } of rest) catalogue(input, dir, 1);
  await expect(assembleStorybook(input, join(tmp(), "out"))).rejects.toThrow(first.dir);
});

test("counts stories, not docs pages", async () => {
  const input = tmp();
  const [first, ...rest] = CATALOGUES;
  catalogue(input, first.dir, 0, 3);
  for (const { dir } of rest) catalogue(input, dir, 1);
  await expect(assembleStorybook(input, join(tmp(), "out"))).rejects.toThrow(first.dir);
});

test("refuses a missing catalogue", async () => {
  await expect(assembleStorybook(tmp(), join(tmp(), "out"))).rejects.toThrow("index.json");
});
