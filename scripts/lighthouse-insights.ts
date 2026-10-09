// Fails when a page's Lighthouse report scores below 1 on an insight this site
// has fixed, so a regression shows up in the lighthouse job instead of in a
// later reading of the reports. Run by scripts/lighthouse.sh over lighthouse/.
//
// cache-insight and document-latency-insight aren't asserted: GitHub Pages
// sets the cache lifetime and the compression, and the site can't change either.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const ASSERTED = [
  "render-blocking-insight",
  "network-dependency-tree-insight",
  "unused-javascript",
  "unused-css-rules",
] as const;

interface Report {
  audits: Record<string, { score?: number | null } | undefined>;
}

export function failingInsights(report: Report): string[] {
  return ASSERTED.filter((id) => {
    const score = report.audits[id]?.score;
    return typeof score === "number" && score < 1;
  });
}

if (import.meta.main) {
  const dir = process.argv[2] ?? "lighthouse";
  let failed = false;
  for (const file of readdirSync(dir)
    .filter((name) => name.endsWith(".report.json"))
    .sort()) {
    const failing = failingInsights(JSON.parse(readFileSync(join(dir, file), "utf8")));
    for (const id of failing) {
      failed = true;
      console.error(`${file}: ${id} scores below 1`);
    }
  }
  if (failed) process.exit(1);
  console.log("Lighthouse insights: every asserted insight passes");
}
