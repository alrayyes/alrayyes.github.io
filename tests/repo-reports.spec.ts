import { expect, type Page, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const DIR = "/pipeline-analytics/reports";

const lighthouseIndex = `<!doctype html><h1>Lighthouse</h1><ul>
<li><a href="assertion-results.json">assertion-results.json</a></li>
<li><a href="lhr-1.html">lhr-1.html</a></li>
<li><a href="login-1.report.html">login-1.report.html</a></li>
<li><a href="manifest.json">manifest.json</a></li></ul>`;

const run = (file: string, representative: boolean, performance: number, page = "login") => ({
  url: `http://localhost:4191/${page}`,
  isRepresentativeRun: representative,
  htmlPath: `/home/runner/work/x/x/web/.lighthouseci/${file}.report.html`,
  jsonPath: `/home/runner/work/x/x/web/.lighthouseci/${file}.report.json`,
  summary: { performance, accessibility: 1, "best-practices": 1, seo: 1 },
});
const manifest = [
  run("login-1", false, 0.84),
  run("login-2", true, 0.83),
  run("login-3", false, 0.83),
  run("settings-1", true, 0.91, "settings"),
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

async function serveReports(
  page: Page,
  { index = true, manifest: withManifest = true }: { index?: boolean; manifest?: boolean } = {},
) {
  await page.route(`**${DIR}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const send = (body: string, type: string) =>
      route.fulfill({ status: 200, contentType: type, body });
    if (!index && path.endsWith("/")) return route.fulfill({ status: 404, body: "not found" });
    switch (path.slice(DIR.length)) {
      case "/lighthouse/":
        return send(
          withManifest
            ? lighthouseIndex
            : lighthouseIndex.replace(/<li><a href="manifest.json".*?<\/li>/, ""),
          "text/html",
        );
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

test("the front page's Lighthouse and Test results links open their own page", async ({ page }) => {
  await serveReports(page);
  await page.goto("/");
  const row = page.locator('[data-repo-row][data-name="pipeline-analytics"]');
  await row.getByRole("link", { name: /^Test results/ }).click();
  await expect(page).toHaveURL(/\/reports\/pipeline-analytics\/tests\/$/);
  await expect(page.getByRole("heading", { level: 2, name: "Tests" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Lighthouse" })).toHaveCount(0);
  await page.goBack();
  await row.getByRole("link", { name: /^Lighthouse/ }).click();
  await expect(page).toHaveURL(/\/reports\/pipeline-analytics\/lighthouse\/$/);
  await expect(page.getByRole("heading", { level: 2, name: "Lighthouse" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Tests" })).toHaveCount(0);
});

test("a repo with no Lighthouse report has no Lighthouse page, and its overview links only what exists", async ({
  page,
}) => {
  const missing = await page.goto("/reports/forge-dashboard-sdk-go/lighthouse/");
  expect(missing?.status()).toBe(404);
  await page.goto("/reports/forge-dashboard-sdk-go/");
  await expect(page.getByRole("link", { name: /^Test results/ })).toHaveAttribute(
    "href",
    "/reports/forge-dashboard-sdk-go/tests/",
  );
  await expect(page.getByRole("link", { name: /^Lighthouse/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: "Coverage" })).toBeVisible();
});

test("a repo's page lists its Lighthouse pages with their scores as text", async ({ page }) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/lighthouse/");
  await expect(page.getByRole("heading", { level: 1, name: "pipeline-analytics" })).toBeVisible();

  const lighthouse = page.getByRole("region", { name: "Lighthouse" });
  const row = lighthouse.getByRole("listitem").filter({ hasText: "/login" }).first();
  await expect(row).toContainText("83%");
  await expect(row).toContainText("Performance");
  await expect(row).toContainText("Accessibility");
  await expect(row).toContainText("Best practices");
  await expect(row).toContainText("SEO");
  const html = row.getByRole("link", { name: "HTML report for /login" });
  await expect(html).toHaveAttribute(
    "href",
    /\/pipeline-analytics\/reports\/lighthouse\/login-2\.report\.html$/,
  );
  await expect(row.getByRole("link", { name: "JSON report for /login" })).toHaveAttribute(
    "href",
    /login-2\.report\.json$/,
  );
  // Icon buttons: an icon and a name, no visible text, and a hit area over 36px.
  await expect(html.locator("svg[aria-hidden='true']")).toHaveCount(1);
  expect((await html.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(36);
  await expect(row.getByText("2 other runs")).toBeVisible();
});

for (const [kind, heading] of [
  ["lighthouse", "Lighthouse"],
  ["tests", "Tests"],
] as const) {
  test(`the ${kind} page has the repo's GitHub mark as an icon button and a heading with an icon`, async ({
    page,
  }) => {
    await serveReports(page);
    await page.goto(`/reports/pipeline-analytics/${kind}/`);
    const repo = page.getByRole("link", { name: "Repository" });
    await expect(repo).toHaveAttribute("href", /github\.com\/alrayyes\/pipeline-analytics$/);
    await expect(repo.locator("svg[aria-hidden='true']")).toHaveCount(1);
    await expect(
      page.getByRole("heading", { level: 2, name: heading }).locator("svg[aria-hidden='true']"),
    ).toHaveCount(1);
  });
}

test("a Lighthouse score is a tile with a percentage, its category and its band in words", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/lighthouse/");
  const row = page
    .getByRole("region", { name: "Lighthouse" })
    .getByRole("listitem")
    .filter({ hasText: "/login" })
    .first();
  const performance = row.locator('[data-score="performance"]').first();
  await expect(performance).toContainText("83%");
  await expect(performance).toContainText("Performance");
  await expect(performance).toContainText("Needs improvement");
  await expect(performance).toHaveAttribute("data-band", "amber");
  const accessibility = row.locator('[data-score="accessibility"]').first();
  await expect(accessibility).toContainText("100%");
  await expect(accessibility).toContainText("Good");
  await expect(accessibility).toHaveAttribute("data-band", "green");
});

test("a Lighthouse page opens with a site average of each category over its pages", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/lighthouse/");
  const average = page.getByRole("group", { name: "Site average" });
  // 83 and 91 average to 87; the other login runs don't count.
  await expect(average.locator('[data-score="performance"]')).toContainText("87%");
  await expect(average.locator('[data-score="performance"]')).toContainText("Needs improvement");
  await expect(average.locator('[data-score="seo"]')).toContainText("100%");
  await expect(average).toContainText("2 pages");
});

test("without a manifest there are no score tiles and no site average, and the links stay", async ({
  page,
}) => {
  await serveReports(page, { manifest: false });
  await page.goto("/reports/pipeline-analytics/lighthouse/");
  await expect(page.getByRole("group", { name: "Site average" })).toHaveCount(0);
  await expect(page.locator("[data-score]")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Lighthouse" }).getByRole("link").first(),
  ).toBeVisible();
});

test("the score tiles fit a 360px screen and pass axe in both themes", async ({ page }) => {
  await serveReports(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/reports/pipeline-analytics/lighthouse/");
  await expect(page.getByRole("group", { name: "Site average" })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expectNoAxeViolations(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await expectNoAxeViolations(page);
});

test("a repo's page lists its test files with what each one found, counting cases when the root has no totals", async ({
  page,
}) => {
  await serveReports(page);
  await page.goto("/reports/pipeline-analytics/tests/");
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
  await page.goto("/reports/pipeline-analytics/tests/");
  const tests = page.getByRole("region", { name: "Tests" });
  const goRow = tests.getByRole("listitem").filter({ hasText: "go.xml" });
  await expect(goRow).toContainText("Could not read this file");
  await expect(goRow.getByRole("link", { name: "Raw XML for go.xml" })).toHaveAttribute(
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
  await page.goto("/reports/pipeline-analytics/tests/");
  const tests = page.getByRole("region", { name: "Tests" });
  await expect(tests.getByRole("link", { name: /Test results/ })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/pipeline-analytics/reports/tests/",
  );
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the page still lists the links the catalogue holds", async ({ page }) => {
    await page.goto("/reports/pipeline-analytics/lighthouse/");
    const lighthouse = page.getByRole("region", { name: "Lighthouse" });
    await expect(lighthouse.getByRole("link", { name: /Lighthouse/ }).first()).toHaveAttribute(
      "href",
      "https://apis.ryankes.eu/pipeline-analytics/reports/lighthouse/",
    );
  });
});

for (const scheme of ["light", "dark"] as const) {
  for (const kind of ["", "lighthouse/", "tests/"]) {
    test(`/reports/<repo>/${kind} has no axe violations in ${scheme} mode`, async ({ page }) => {
      await serveReports(page);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/reports/pipeline-analytics/${kind}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (kind === "tests/") await expect(page.getByText("51 tests, 0 failed")).toBeVisible();
      if (kind === "lighthouse/")
        await expect(page.getByText("2 other runs").first()).toBeVisible();
      await expectNoAxeViolations(page);
    });
  }
}

for (const kind of ["", "lighthouse/", "tests/"]) {
  test(`/reports/<repo>/${kind} fits a 360px screen without scrolling sideways`, async ({
    page,
  }) => {
    await serveReports(page);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`/reports/pipeline-analytics/${kind}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (kind === "tests/") await expect(page.getByText("51 tests, 0 failed")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
