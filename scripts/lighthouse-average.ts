// Averages the site's own Lighthouse reports for the front page. The `build`
// job in ci.yml runs it just before the deploy build, over the reports the
// `reports` job assembled, and writes src/data/lighthouse-average.json. The
// page then shows plain HTML: no browser fetch, which Lighthouse would count as
// a network dependency chain on the home page. Nothing commits the file; the
// copy in git is a seed so a local build and the tests don't need CI's reports.
// With no readable report the file is left alone. Run it as
// `bun scripts/lighthouse-average.ts <reports/lighthouse dir> [out]`.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type LighthouseRow, scoresFromReport, siteAverage } from "../src/lib/reportDirectory";

export interface LighthouseAverage {
  pages: number;
  scores: Record<string, number>;
}

export function averageOf(dir: string): LighthouseAverage | null {
  let names: string[];
  try {
    names = readdirSync(dir).filter((name) => name.endsWith(".report.json"));
  } catch {
    return null;
  }
  const rows: LighthouseRow[] = names.flatMap((name) => {
    try {
      const scores = scoresFromReport(JSON.parse(readFileSync(join(dir, name), "utf8")));
      return scores ? [{ page: name, representative: { html: "", scores }, others: [] }] : [];
    } catch {
      return [];
    }
  });
  const scores = siteAverage(rows);
  return scores ? { pages: rows.length, scores } : null;
}

if (import.meta.main) {
  const dir = process.argv[2] ?? "dist/reports/lighthouse";
  const out = process.argv[3] ?? "src/data/lighthouse-average.json";
  const average = averageOf(dir);
  if (average) {
    writeFileSync(out, `${JSON.stringify(average, null, 2)}\n`);
    console.log(`wrote the average of ${average.pages} pages to ${out}`);
  } else {
    console.warn(`no readable Lighthouse report in ${dir}, so ${out} is unchanged`);
  }
}
