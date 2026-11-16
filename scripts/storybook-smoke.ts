// Smoke test for the Storybook catalogue: the stories render, the build
// succeeds and index.json lists at least one story. It builds, so it is not
// named *.test.ts, which `bun run test:unit` would pick up on every push. Run
// it with `bun run test:storybook`.
import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.join(import.meta.dir, "..");

test("storybook build succeeds and index.json lists at least one story", () => {
  const out = mkdtempSync(path.join(tmpdir(), "storybook-smoke-"));
  try {
    const run = (cmd: string[]) =>
      Bun.spawnSync(cmd, { cwd: root, stdout: "inherit", stderr: "inherit" }).exitCode;
    expect(run(["bun", "scripts/render-stories.ts"])).toBe(0);
    expect(run(["bunx", "storybook", "build", "--quiet", "-o", out])).toBe(0);
    const index = JSON.parse(readFileSync(path.join(out, "index.json"), "utf8"));
    const stories = Object.values<{ type: string }>(index.entries).filter(
      (e) => e.type === "story",
    );
    expect(stories.length).toBeGreaterThan(0);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}, 240_000);
