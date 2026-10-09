import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const DIR = "/pipeline-analytics/reports";

const lighthouseIndex = `<!doctype html><h1>Lighthouse</h1><ul>
<li><a href="assertion-results.json">assertion-results.json</a></li>
<li><a href="lhr-1.html">lhr-1.html</a></li>
<li><a href="login-1.report.html">login-1.report.html</a></li>
<li><a href="manifest.json">manifest.json</a></li></ul>`;

const run = (file: string, representative: boolean, performance: number) => ({
  url: "http://localhost:4191/login",
  isRepresentativeRun: representative,
  htmlPath: `/home/runner/work/x/x/web/.lighthouseci/${file}.report.html`,
  jsonPath: `/home/runner/work/x/x/web/.lighthouseci/${file}.report.json`,
  summary: { performance, accessibility: 1, "best-practices": 1, seo: 1 },
});
const manifest = [
  run("login-1", false, 0.84),
  run("login-2", true, 0.83),
  run("login-3", false, 0.83),
];

const testsIndex = `<!doctype html><ul>
<li><a href="e2e.xml">e2e.xml</a></li><li><a href="frontend.xml">frontend.xml</a></li>
<li><a href="go.xml">go.xml</a></li><li><a href="../">up</a></li></ul>`;

// Root totals present, as pipeline-analytics' e2e.xml has them.
const e2e = `<?xml version="1.0"?><testsuites tests="51" failures="0" errors="0" skipped="0" time="58.75312">
<testsuite name="e2e" tests="51"><testcase name="a" time="1"/></testsuite></testsuites>`;
// No totals on the root, one failure and one skip, as hush-hush-php's file is.
const frontend = `<?xml version="1.0"?><testsuites><testsuite name="x">
<testcase name="ok" time="0.25"/><testcase name="bad" time="0.25"><failure message="boom"/></testcase>
<testcase name="later" time="0.5"><skipped/></testcase></testsuite></testsuites>`;

async function serveReports(page: Page, { index = true }: { index?: boolean } = {}) {
  await page.route(`**${DIR}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const send = (body: string, type: string) =>
      route.fulfill({ status: 200, contentType: type, body });
    if (!index && path.endsWith("/")) return route.fulfill({ status: 404, body: "not found" });
    switch (path.slice(DIR.length)) {
      case "/lighthouse/":
        return send(lighthouseIndex, "text/html");
      case "/lighthouse/manifest.json":
        return send(JSON.stringify(manifest), "application/json");
      case "/tests/":
        return send(testsIndex, "text/html");
      case "/tests/e2e.xml":
        return send(e2e, "application/xml");
      case "/tests/frontend.xml":
        return send(frontend, "application/xml");
      default:
        return route.fulfill({ status: 500, body: "broken" });
    }
  });
}

test("the front page's Lighthouse and Test results links land on their own section", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/");
  const row = page.locator('[data-repo-row][data-name="pipeline-analytics"]');
  await row.getByRole("link", { name: /^Test results/ }).click();
  await expect(page).toHaveURL(/\/reports\/pipeline-analytics\/#repo-reports-tests$/);
  await expect(page.locator("#repo-reports-tests")).toBeInViewport();
  await expect(page.locator("#repo-reports-lighthouse")).toHaveCount(1);
});

test("a repo's page lists its Lighthouse pages with their scores as text", async ({ page }) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/");
  await expect(page.getByRole("heading", { level: 1, name: "pipeline-analytics" })).toBeVisible();

  const lighthouse = page.getByRole("region", { name: "Lighthouse" });
  const row = lighthouse.getByRole("listitem").filter({ hasText: "/login" }).first();
  await expect(row).toContainText("Performance 83");
  await expect(row).toContainText("Accessibility 100");
  await expect(row).toContainText("Best practices 100");
  await expect(row).toContainText("SEO 100");
  await expect(row.getByRole("link", { name: /Open HTML report/ })).toHaveAttribute(
    "href",
    /\/pipeline-analytics\/reports\/lighthouse\/login-2\.report\.html$/,
  );
  await expect(row.getByText("2 other runs")).toBeVisible();
});

test("a repo's page lists its test files with what each one found, counting cases when the root has no totals", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/");
  const tests = page.getByRole("region", { name: "Tests" });

  const e2eRow = tests.getByRole("listitem").filter({ hasText: "e2e.xml" });
  await expect(e2eRow).toContainText("51 tests, 0 failed, 0 errors, 0 skipped");
  await expect(e2eRow).toContainText("58.8 s");

  const frontendRow = tests.getByRole("listitem").filter({ hasText: "frontend.xml" });
  await expect(frontendRow).toContainText("3 tests, 1 failed, 0 errors, 1 skipped");
  await expect(frontendRow).toContainText("Failed");
});

test("a file that can't be read says so, still links, and leaves the other rows alone", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/");
  const tests = page.getByRole("region", { name: "Tests" });
  const goRow = tests.getByRole("listitem").filter({ hasText: "go.xml" });
  await expect(goRow).toContainText("Could not read this file");
  await expect(goRow.getByRole("link", { name: /Open XML/ })).toHaveAttribute(
    "href",
    /\/tests\/go\.xml$/,
  );
  await expect(tests.getByRole("listitem").filter({ hasText: "e2e.xml" })).toContainText(
    "51 tests",
  );
});

test("a directory with no index page still lists the reports the catalogue links", async ({
  page,
}) => {
  await serveReports(page, { index: false });
  await page.goto("/reports/pipeline-analytics/");
  const tests = page.getByRole("region", { name: "Tests" });
  await expect(tests.getByRole("link", { name: /Test results/ })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/pipeline-analytics/reports/tests/",
  );
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page still lists the links the catalogue holds", async ({ page }) => {
    await page.goto("/reports/pipeline-analytics/");
    const lighthouse = page.getByRole("region", { name: "Lighthouse" });
    await expect(lighthouse.getByRole("link", { name: /Lighthouse/ }).first()).toHaveAttribute(
      "href",
      "https://apis.ryankes.eu/pipeline-analytics/reports/lighthouse/",
    );
  });
});

for (const scheme of ["light", "dark"] as const) {
  test(`a repo's page has no axe violations in ${scheme} mode`, async ({ page }) => {
    await serveReports(page);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/reports/pipeline-analytics/");
    await expect(page.getByText("51 tests, 0 failed")).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("a repo's page fits a 360px screen without scrolling sideways", async ({ page }) => {
  await serveReports(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/reports/pipeline-analytics/");
  await expect(page.getByText("51 tests, 0 failed")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
