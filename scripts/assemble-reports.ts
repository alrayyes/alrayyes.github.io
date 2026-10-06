// Gathers the reports CI produced into the directory the site serves at
// /reports/, in the layout every repo in the catalogue publishes. (Other repos
// serve it at /<repo>/reports/; this one is the user site, which has no
// repo-name prefix.) Run it as `bun scripts/assemble-reports.ts <out-dir>`
// from the repo root, after the test job has written its files.
//
// It refuses to run when a required file is missing: a half-populated
// reports directory would deploy, replace the last good one, and 404 the
// links the catalogue points at.
import { access, cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface IndexLink {
  label: string;
  href: string;
}

const REQUIRED = [
  "junit/unit.xml",
  "playwright-report/junit.xml",
  "coverage/lcov.info",
  "coverage/coverage.xml",
  "coverage/html/index.html",
];

const PLAYWRIGHT_HTML = "playwright-report/html";

const escapeHtml = (text: string) => Bun.escapeHTML(text);

// GitHub Pages has no directory listing, so every directory a link points at
// needs a page of its own. No colours of its own: `color-scheme` lets the
// browser's default link and background colours follow light and dark mode.
export function renderIndex(title: string, links: IndexLink[]): string {
  const items = links
    .map(
      ({ label, href }) => `      <li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      :root { color-scheme: light dark; }
      body { font: 1rem/1.5 system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }
      li { margin: 0.5rem 0; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <ul>
${items}
      </ul>
    </main>
  </body>
</html>
`;
}

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false,
  );

// One HTML and one JSON report per audited page, named <page>.report.html and
// <page>.report.json, which is what the lighthouse CLI writes for
// --output-path <dir>/<page>. At least one page, and no HTML without its JSON.
async function lighthousePages(root: string): Promise<string[]> {
  const files = await readdir(join(root, "lighthouse")).catch((): string[] => []);
  const pages = files
    .filter((file) => file.endsWith(".report.html"))
    .map((file) => file.slice(0, -".report.html".length))
    .sort();
  if (pages.length === 0) {
    throw new Error("missing report input: lighthouse/*.report.html");
  }
  for (const page of pages) {
    if (!files.includes(`${page}.report.json`)) {
      throw new Error(`missing report input: lighthouse/${page}.report.json`);
    }
  }
  return pages;
}

export async function assembleReports({ root, out }: { root: string; out: string }) {
  for (const path of REQUIRED) {
    if (!(await exists(join(root, path)))) {
      throw new Error(`missing report input: ${path}`);
    }
  }

  await mkdir(join(out, "tests"), { recursive: true });
  await cp(join(root, "junit/unit.xml"), join(out, "tests/unit.xml"));
  await cp(join(root, "playwright-report/junit.xml"), join(out, "tests/playwright.xml"));
  const hasPlaywrightHtml = await exists(join(root, PLAYWRIGHT_HTML));
  if (hasPlaywrightHtml) {
    await cp(join(root, PLAYWRIGHT_HTML), join(out, "tests/playwright"), { recursive: true });
  }

  await cp(join(root, "coverage/html"), join(out, "coverage"), { recursive: true });
  await cp(join(root, "coverage/lcov.info"), join(out, "coverage/lcov.info"));
  await cp(join(root, "coverage/coverage.xml"), join(out, "coverage/coverage.xml"));

  const pages = await lighthousePages(root);
  await mkdir(join(out, "lighthouse"), { recursive: true });
  const lighthouseLinks: IndexLink[] = [];
  for (const page of pages) {
    await cp(
      join(root, `lighthouse/${page}.report.html`),
      join(out, `lighthouse/${page}.report.html`),
    );
    await cp(
      join(root, `lighthouse/${page}.report.json`),
      join(out, `lighthouse/${page}.report.json`),
    );
    lighthouseLinks.push(
      { label: `${page} (HTML report)`, href: `${page}.report.html` },
      { label: `${page} (JSON)`, href: `${page}.report.json` },
    );
  }
  await writeFile(
    join(out, "lighthouse/index.html"),
    renderIndex("Lighthouse reports", lighthouseLinks),
  );

  const testLinks: IndexLink[] = [
    { label: "Unit tests (JUnit XML)", href: "unit.xml" },
    { label: "End-to-end tests (JUnit XML)", href: "playwright.xml" },
  ];
  if (hasPlaywrightHtml) {
    testLinks.push({ label: "End-to-end tests (HTML report)", href: "playwright/" });
  }
  await writeFile(join(out, "tests/index.html"), renderIndex("Test results", testLinks));
  await writeFile(
    join(out, "index.html"),
    renderIndex("alrayyes.github.io reports", [
      { label: "Test results", href: "tests/" },
      { label: "Coverage", href: "coverage/" },
      { label: "Coverage (Cobertura XML)", href: "coverage/coverage.xml" },
      { label: "Lighthouse", href: "lighthouse/" },
    ]),
  );
}

if (import.meta.main) {
  const out = process.argv[2];
  if (!out) {
    console.error("usage: bun scripts/assemble-reports.ts <out-dir>");
    process.exit(2);
  }
  await assembleReports({ root: process.cwd(), out });
}
