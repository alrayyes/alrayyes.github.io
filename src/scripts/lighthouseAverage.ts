// Fills the front page's Lighthouse tile with this site's average scores. It
// reads the report JSON each audited page published at /reports/lighthouse/, so
// a page that hasn't been audited yet, or a failed fetch, just doesn't count,
// and with none readable the tile stays hidden.
import {
  bandLabel,
  type LighthouseRow,
  type Scores,
  scoresFromReport,
  siteAverage,
} from "../lib/reportDirectory";

const NAMES: [string, string][] = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best practices"],
  ["seo", "SEO"],
];

const tile = document.querySelector<HTMLElement>('[data-stat="Lighthouse"]');
const list = tile?.querySelector<HTMLElement>("[data-lighthouse-scores]");
const count = tile?.querySelector<HTMLElement>("[data-lighthouse-count]");

async function scoresOf(page: string): Promise<Scores | null> {
  try {
    const response = await fetch(`/reports/lighthouse/${page}.report.json`);
    return response.ok ? scoresFromReport(await response.json()) : null;
  } catch {
    return null;
  }
}

async function show() {
  if (!tile || !list || !count) return;
  const pages = (tile.dataset.pages ?? "").split(",").filter(Boolean);
  const all = await Promise.all(pages.map(scoresOf));
  const rows: LighthouseRow[] = all.flatMap((scores, i) =>
    scores ? [{ page: pages[i] ?? "", representative: { html: "", scores }, others: [] }] : [],
  );
  const average = siteAverage(rows);
  if (!average) return;
  for (const [key, label] of NAMES) {
    const score = average[key];
    if (score === undefined) continue;
    const item = document.createElement("li");
    item.className = "text-sm text-slate-700 dark:text-slate-300";
    const value = document.createElement("span");
    value.className = "font-mono text-lg font-semibold text-slate-900 dark:text-slate-100";
    value.textContent = `${score}%`;
    item.append(`${label} `, value, ` ${bandLabel(score)}`);
    list.append(item);
  }
  count.textContent = `${rows.length} ${rows.length === 1 ? "page" : "pages"}`;
  tile.dataset.pages = String(rows.length);
  tile.hidden = false;
}

void show();
