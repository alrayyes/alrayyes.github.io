// Reads a repo's own Lighthouse and test directories from the same origin and
// replaces the catalogue's links on a report page with rows that say what each
// report found. Loaded by the Lighthouse and Tests pages; a section is any
// element with data-kind, data-dir, a data-fallback list and a data-rows list.
import { ICONS, type IconName } from "../lib/icons";
import { describeSummary, junitSummary } from "../lib/junit";
import type { LighthouseRow, LighthouseRun } from "../lib/reportDirectory";
import {
  directoryLinks,
  lighthouseRowsFromFiles,
  lighthouseRowsFromManifest,
  sameOriginPath,
  scoreBand,
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
  const item = el("div", {
    class: "flex flex-wrap items-start justify-between gap-3",
  });
  const chips = el("div", { class: "flex flex-wrap gap-1.5" });
  for (const [key, score] of Object.entries(run.scores ?? {})) {
    chips.append(
      el("span", {
        class: `rounded border px-2 py-0.5 text-sm ${BAND_CLASS[scoreBand(score)]}`,
        text: `${SCORE_NAMES[key] ?? key} ${score}`,
        attrs: { "data-score": key, "data-band": scoreBand(score) },
      }),
    );
  }
  const buttons = el("div", { class: "ml-auto flex gap-2" });
  buttons.append(iconButton(dir, run.html, "open", `HTML report for ${row.page}`));
  if (run.json) buttons.append(iconButton(dir, run.json, "braces", `JSON report for ${row.page}`));
  item.append(chips, buttons);
  return item;
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
