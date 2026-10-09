import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const row = (page: import("@playwright/test").Page, name: string) =>
  page.locator(`[data-repo-row][data-name="${name}"]`);

test("the front page lists every repo once, A to Z, with SDKs under their API and scaffolds together", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Repositories" })).toBeVisible();

  const names = await page
    .locator("[data-repo-row]")
    .evaluateAll((rows) => rows.map((el) => (el as HTMLElement).dataset.name ?? ""));
  expect(names).toContain("alrayyes.github.io");
  expect(names).toContain("Hush-Hush");
  expect(names).toContain("scaffold-go-api");
  expect(new Set(names).size).toBe(names.length);
  const topLevel = await page
    .locator("[data-repo-row]:not(ul ul [data-repo-row])")
    .evaluateAll((rows) =>
      rows
        .map((el) => (el as HTMLElement).dataset)
        .filter((data) => data.kind !== "Scaffold")
        .map((data) => data.name ?? ""),
    );
  const sorted = [...topLevel].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  expect(topLevel).toEqual(sorted);
});

test("an API lists its SDKs under it", async ({ page }) => {
  await page.goto("/");
  const sdks = page.getByRole("list", { name: "SDKs for forge-dashboard" });
  await expect(sdks.locator('[data-repo-row][data-kind="SDK"]').first()).toBeVisible();
  await expect(page.locator('[data-letter-group] > ul > li > div[data-kind="SDK"]')).toHaveCount(0);
});

test("every scaffold sits in one Scaffolding group", async ({ page }) => {
  await page.goto("/");
  const group = page.getByRole("region", { name: "Scaffolding", exact: true });
  await expect(group.locator('[data-repo-row][data-name="scaffold-go-api"]')).toHaveCount(1);
  await expect(page.locator('[data-repo-row][data-kind="Scaffold"]')).toHaveCount(
    await group.locator('[data-repo-row][data-kind="Scaffold"]').count(),
  );
});

test("letter headings divide the list, and every repo sits under its own letter", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: "H", exact: true })).toBeVisible();
  const h = page.getByRole("region", { name: "H", exact: true });
  await expect(h.locator('[data-repo-row][data-name="Hush-Hush"]')).toHaveCount(1);
});

test("each repo's name links to its repo", async ({ page }) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("heading").getByRole("link"),
  ).toHaveAttribute("href", "https://github.com/alrayyes/forge-dashboard-sdk-go");
});

test("Lighthouse and Test results are the primary links, each with an icon and a text label, and go to the repo's report page", async ({
  page,
}) => {
  await page.goto("/");
  const analytics = row(page, "pipeline-analytics");
  const lighthouse = analytics.getByRole("link", { name: /^Lighthouse/ });
  const tests = analytics.getByRole("link", { name: /^Test results/ });
  await expect(lighthouse).toHaveAttribute("href", "/reports/pipeline-analytics/");
  await expect(tests).toHaveAttribute("href", "/reports/pipeline-analytics/");
  for (const link of [lighthouse, tests]) {
    await expect(link.locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
});

test("coverage and the raw files are secondary links, each with an icon", async ({ page }) => {
  await page.goto("/");
  const go = row(page, "forge-dashboard-sdk-go");
  const coverage = go.getByRole("link", { name: /^Coverage/ });
  await expect(coverage).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard-sdk-go/reports/coverage/",
  );
  await expect(coverage.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const xml = go.getByRole("link", { name: /^coverage\.xml/ });
  await expect(xml).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard-sdk-go/reports/coverage/coverage.xml",
  );
  await expect(xml.locator("svg[aria-hidden='true']")).toHaveCount(1);
});

test("a repo with no Lighthouse report has no Lighthouse link", async ({ page }) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("link", { name: /^Lighthouse/ }),
  ).toHaveCount(0);
});

test("a link's name says which repo it belongs to, and still starts with its visible text", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("link", {
      name: "Coverage for forge-dashboard-sdk-go",
    }),
  ).toBeVisible();
});

test("this site's own row links its report files", async ({ page }) => {
  await page.goto("/");
  const site = row(page, "alrayyes.github.io");
  await expect(site.getByRole("link", { name: /^coverage\.xml/ })).toHaveAttribute(
    "href",
    "/reports/coverage/coverage.xml",
  );
  await expect(site.getByRole("link", { name: /^Lighthouse/ })).toHaveAttribute(
    "href",
    "/reports/alrayyes.github.io/",
  );
});

test("an API row keeps its OpenAPI spec and docs links", async ({ page }) => {
  await page.goto("/");
  const hush = row(page, "Hush-Hush");
  await expect(hush.getByRole("link", { name: /^OpenAPI spec/ })).toBeVisible();
  await expect(hush.getByRole("link", { name: /^Docs/ })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/Hush-Hush/docs/api/#description/introduction",
  );
});

test("the filter narrows the repos, announces the count, and says when nothing matches", async ({
  page,
}) => {
  await page.goto("/");
  const filter = page.getByLabel("Filter repositories by name");
  const status = page.getByRole("status");
  const total = await page.locator("[data-repo-row]").count();
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);

  await filter.fill("scaffold-go");
  await expect(page.locator("[data-repo-row]:visible")).toHaveCount(1);
  await expect(status).toHaveText(`Showing 1 of ${total} repositories`);
  await expect(page.getByRole("heading", { level: 2, name: "H", exact: true })).toBeHidden();

  await filter.fill("no-such-repo");
  await expect(page.locator("[data-repo-row]:visible")).toHaveCount(0);
  await expect(page.getByText("No matching repositories")).toBeVisible();

  await filter.fill("");
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);
});

test("the kind chips filter by API, SDK, Scaffold or Other", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Scaffold", exact: true }).click();
  await expect(page.getByRole("button", { name: "Scaffold", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const kinds = await page
    .locator("[data-repo-row]:visible")
    .evaluateAll((rows) => rows.map((el) => (el as HTMLElement).dataset.kind));
  expect(kinds.length).toBeGreaterThan(0);
  expect(new Set(kinds)).toEqual(new Set(["Scaffold"]));

  await page.getByRole("button", { name: "All", exact: true }).click();
  expect(await page.locator("[data-repo-row]:visible").count()).toBeGreaterThan(kinds.length);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole list is there and the filter isn't", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("[data-repo-row]:visible").count()).toBeGreaterThan(15);
    await expect(page.getByLabel("Filter repositories by name")).toBeHidden();
  });
});

test("/reports/ points to the front page", async ({ page }) => {
  await page.goto("/reports/");
  await expect(page.getByRole("link", { name: "front page" })).toHaveAttribute("href", "/");
});

for (const scheme of ["light", "dark"] as const) {
  test(`the front page has no axe violations in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Repositories" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("the front page fits a 360px screen without scrolling sideways, and its links are at least 24px tall", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  for (const link of await row(page, "alrayyes.github.io").getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
});
