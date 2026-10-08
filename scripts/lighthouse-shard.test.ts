import { describe, expect, test } from "bun:test";

// The shards must between them cover every page exactly once, or a report
// goes missing from the deploy (or is audited twice and one copy overwrites
// the other). See scripts/lighthouse-shard.sh.
function shard(pages: string[], index: number, total: number) {
  const result = Bun.spawnSync(
    ["bash", "scripts/lighthouse-shard.sh", String(index), String(total)],
    {
      stdin: new TextEncoder().encode(pages.map((page) => `${page}\n`).join("")),
    },
  );
  expect(result.exitCode).toBe(0);
  return result.stdout.toString().split("\n").filter(Boolean);
}

const pages = Array.from({ length: 25 }, (_, i) => `dist/page-${i}/index.html`);

describe("lighthouse-shard.sh", () => {
  test.each([1, 2, 4, 7])("%i shards cover every page exactly once", (total) => {
    const covered = Array.from({ length: total }, (_, i) => shard(pages, i + 1, total)).flat();
    expect(covered.sort()).toEqual([...pages].sort());
  });

  test("shards stay within one page of each other in size", () => {
    const sizes = [1, 2, 3, 4].map((i) => shard(pages, i, 4).length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  test("a single shard gets every page", () => {
    expect(shard(pages, 1, 1)).toEqual(pages);
  });

  test("rejects a shard outside 1..total", () => {
    for (const [index, total] of [
      [0, 4],
      [5, 4],
      [1, 0],
    ]) {
      const result = Bun.spawnSync(
        ["bash", "scripts/lighthouse-shard.sh", String(index), String(total)],
        {
          stdin: new TextEncoder().encode("a\n"),
        },
      );
      expect(result.exitCode).not.toBe(0);
    }
  });
});
