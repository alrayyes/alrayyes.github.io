// Reads a repo's own Lighthouse and test directories from the same origin and
// replaces the catalogue's links on a report page with rows that say what each
// report found. Loaded by the Lighthouse and Tests pages; a section is any
// element with data-kind, data-dir, a data-fallback list and a data-rows list.
import { ICONS, type IconName } from "../lib/icons";
import { describeSummary, junitSummary } from "../lib/junit";
import type { LighthouseRow, LighthouseRun } from "../lib/reportDirectory";
import {
  bandLabel,
  directoryLinks,
  lighthouseRowsFromFiles,
  lighthouseRowsFromManifest,
  type Scores,
  sameOriginPath,
  scoreBand,
  siteAverage,
} from "../lib/reportDirectory";

// Outline icon buttons, 36px square: a glyph and a visually hidden name that
// says which page or file the link opens. The title is only the tooltip.
const buttonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-800 hover:border-accent hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-accent-dark dark:hover:bg-slate-800";
const rowClass =
  "rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800";
const SCORE_NAMES: Record<string, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best practices",
  seo: "SEO",
};
// Lighthouse's bands. The number is always in the chip, so colour never
// carries the meaning alone.
const BAND_CLASS = {
  green:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  amber:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200",
  red: "border-red-300 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200",
} as const;

const RING_CLASS = {
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-500 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
} as const;

function ring(score: number) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 36 36");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", `size-12 -rotate-90 ${RING_CLASS[scoreBand(score)]}`);
  for (const [filled, extra] of [
    [false, "opacity-20"],
    [true, ""],
  ] as const) {
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", "18");
    circle.setAttribute("cy", "18");
    circle.setAttribute("r", "15.5");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "currentColor");
    circle.setAttribute("stroke-width", "3");
    circle.setAttribute("class", extra);
    if (filled) {
      circle.setAttribute("pathLength", "100");
      circle.setAttribute("stroke-dasharray", `${score} 100`);
      circle.setAttribute("stroke-linecap", "round");
    }
    svg.append(circle);
  }
  return svg;
}

// One score: a ring that fills to it, the percentage, the category and the
// band in words. The ring is decoration; the text says all of it.
function scoreTile(key: string, score: number) {
  const band = scoreBand(score);
  const tile = el("div", {
    class:
      "flex flex-col items-center gap-1 rounded-md border border-slate-200 bg-white p-2 text-center dark:border-slate-700 dark:bg-slate-900",
    attrs: { "data-score": key, "data-band": band },
  });
  const dial = el("div", {
    class: "relative flex size-12 items-center justify-center",
  });
  dial.append(
    ring(score),
    el("span", {
      class: "absolute font-mono text-xs font-semibold text-slate-900 dark:text-slate-100",
      text: `${score}%`,
    }),
  );
  tile.append(
    dial,
    el("span", {
      class: "text-sm text-slate-800 dark:text-slate-200",
      text: SCORE_NAMES[key] ?? key,
    }),
    el("span", {
      class: `rounded border px-1.5 text-xs font-medium ${BAND_CLASS[band]}`,
      text: bandLabel(score),
    }),
  );
  return tile;
}

const tileGrid = "grid grid-cols-2 gap-2 sm:grid-cols-4";

function scoreTiles(scores: Scores) {
  const grid = el("div", { class: tileGrid });
  for (const [key, score] of Object.entries(scores)) grid.append(scoreTile(key, score));
  return grid;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    class?: string;
    text?: string;
    attrs?: Record<string, string>;
  } = {},
) {
  const node = document.createElement(tag);
  if (options.class) node.className = options.class;
  if (options.text !== undefined) node.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) node.setAttribute(name, value);
  return node;
}

function icon(name: IconName, className = "size-4") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", ICONS[name]);
  svg.append(path);
  return svg;
}

// A link to a file in a directory, only ever to http(s), whatever the
// directory's page claimed the file was called.
function iconButton(dir: string, name: string, glyph: IconName, label: string) {
  const url = new URL(name, new URL(dir, location.href));
  const link = el("a", { class: buttonClass, attrs: { title: label } });
  if (url.protocol === "https:" || url.protocol === "http:") link.href = url.href;
  link.append(icon(glyph), el("span", { class: "sr-only", text: label }));
  return link;
}

async function fetchText(url: string) {
  const response = await fetch(sameOriginPath(url));
  if (!response.ok) throw new Error(String(response.status));
  return response.text();
}

function lighthouseRun(dir: string, row: LighthouseRow, run: LighthouseRun) {
  const item = el("div", { class: "flex flex-col gap-3" });
  const buttons = el("div", { class: "flex gap-2" });
  buttons.append(iconButton(dir, run.html, "open", `HTML report for ${row.page}`));
  if (run.json) buttons.append(iconButton(dir, run.json, "braces", `JSON report for ${row.page}`));
  item.append(buttons);
  if (run.scores) item.append(scoreTiles(run.scores));
  return item;
}

// The mean of each category over the pages, above the rows.
function renderAverage(rows: LighthouseRow[], list: HTMLElement) {
  const average = siteAverage(rows);
  if (!average) return;
  const group = el("div", {
    class: `${rowClass} mt-3 flex flex-col gap-3`,
    attrs: { role: "group", "aria-label": "Site average" },
  });
  group.append(
    el("p", {
      class: "text-sm font-semibold text-slate-900 dark:text-slate-100",
      text: "Site average",
    }),
    el("p", {
      class: "text-sm text-slate-700 dark:text-slate-300",
      text: `Mean over ${rows.length} page${rows.length === 1 ? "" : "s"}`,
    }),
    scoreTiles(average),
  );
  list.before(group);
}

function renderLighthouse(dir: string, rows: LighthouseRow[], list: HTMLElement) {
  for (const row of rows) {
    const li = el("li", { class: rowClass });
    li.append(
      el("p", {
        class: "mb-2 font-mono text-sm font-semibold break-all text-slate-900 dark:text-slate-100",
        text: row.page,
      }),
    );
    li.append(lighthouseRun(dir, row, row.representative));
    if (row.others.length > 0) {
      const details = el("details", { class: "mt-3" });
      const count = row.others.length;
      details.append(
        el("summary", {
          class: "min-h-8 cursor-pointer text-sm text-slate-600 dark:text-slate-400",
          text: `${count} other run${count === 1 ? "" : "s"}`,
        }),
      );
      for (const run of row.others) {
        const wrapper = el("div", { class: "mt-2" });
        wrapper.append(lighthouseRun(dir, row, run));
        details.append(wrapper);
      }
      li.append(details);
    }
    list.append(li);
  }
}

const STATUS_CLASS = {
  ok: "text-emerald-700 dark:text-emerald-400",
  failed: "text-red-700 dark:text-red-400",
  unreadable: "text-amber-700 dark:text-amber-400",
  reading: "text-slate-500 dark:text-slate-400",
} as const;

function testRow(dir: string, name: string, list: HTMLElement) {
  const li = el("li", { class: `${rowClass} flex items-start gap-3` });
  let glyph = icon("file", "mt-0.5 size-5 shrink-0");
  glyph.classList.add(...STATUS_CLASS.reading.split(" "));
  const text = el("div", { class: "min-w-0 flex-1" });
  const title = el("p", {
    class:
      "flex flex-wrap items-center gap-2 font-mono text-sm font-semibold break-all text-slate-900 dark:text-slate-100",
  });
  title.append(document.createTextNode(name));
  const status = el("p", {
    class: "mt-1 text-sm text-slate-700 dark:text-slate-300",
    text: "Reading…",
  });
  text.append(title, status);
  li.append(glyph, text, iconButton(dir, name, "file", `Raw XML for ${name}`));
  list.append(li);

  const setState = (state: keyof typeof STATUS_CLASS, glyphName: IconName, badge?: string) => {
    const next = icon(glyphName, "mt-0.5 size-5 shrink-0");
    next.classList.add(...STATUS_CLASS[state].split(" "));
    glyph.replaceWith(next);
    glyph = next;
    li.dataset.state = state;
    if (badge)
      title.append(
        el("span", {
          class: `inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-sans text-xs font-medium ${BAND_CLASS[state === "failed" ? "red" : "amber"]}`,
          text: badge,
        }),
      );
  };

  fetchText(new URL(name, new URL(dir, location.href)).href)
    .then((xml) => {
      const summary = junitSummary(new DOMParser().parseFromString(xml, "application/xml"));
      const failing = summary.failed + summary.errors > 0;
      status.textContent = `${describeSummary(summary)}, ${summary.seconds.toFixed(1)} s`;
      if (failing) setState("failed", "failed", "Failed");
      else setState("ok", "tests");
    })
    .catch(() => {
      status.textContent = "Could not read this file";
      setState("unreadable", "warning");
    });
}

async function enhance(section: HTMLElement) {
  const dir = section.dataset.dir;
  const rows = section.querySelector<HTMLElement>("[data-rows]");
  const fallback = section.querySelector<HTMLElement>("[data-fallback]");
  if (!dir || !rows || !fallback) return;
  try {
    const files = directoryLinks(await fetchText(dir));
    if (section.dataset.kind === "lighthouse") {
      const lighthouseRows = files.includes("manifest.json")
        ? lighthouseRowsFromManifest(
            JSON.parse(await fetchText(new URL("manifest.json", new URL(dir, location.href)).href)),
          )
        : lighthouseRowsFromFiles(files);
      if (lighthouseRows.length === 0) return;
      renderAverage(lighthouseRows, rows);
      renderLighthouse(dir, lighthouseRows, rows);
    } else if (section.dataset.kind === "tests") {
      const xml = files.filter((file) => file.endsWith(".xml"));
      if (xml.length === 0) return;
      for (const name of xml) testRow(dir, name, rows);
    } else {
      return;
    }
    rows.hidden = false;
    fallback.hidden = true;
  } catch {
    // No index page to read: the catalogue's links stay.
  }
}

for (const section of document.querySelectorAll<HTMLElement>("[data-kind]")) void enhance(section);
