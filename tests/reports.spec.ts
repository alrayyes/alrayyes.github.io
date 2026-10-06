import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("the Reports page has one section per repo, each headed by its name and linked to its repo", async ({
  page,
}) => {
  await page.goto("/reports/");
  await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();

  const names = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(names).toContain("alrayyes.github.io");
  expect(names).toContain("forge-dashboard-sdk-go");
  expect(names).toContain("scaffold-go-api");
  expect(new Set(names).size).toBe(names.length);

  await expect(
    page.getByRole("heading", { level: 2, name: "forge-dashboard-sdk-go" }).getByRole("link"),
  ).toHaveAttribute("href", "https://github.com/alrayyes/forge-dashboard-sdk-go");
});

test("this site's section links each of its own report files, with the format shown in text", async ({
  page,
}) => {
  await page.goto("/reports/");
  const site = page.getByRole("region", { name: "alrayyes.github.io" });

  const coverageXml = site.getByRole("link", { name: /^coverage\.xml/ });
  await expect(coverageXml).toHaveAttribute("href", "/reports/coverage/coverage.xml");
  await expect(coverageXml).toContainText("XML");

  await expect(site.getByRole("link", { name: /^unit\.xml/ })).toHaveAttribute(
    "href",
    "/reports/tests/unit.xml",
  );
  await expect(site.getByRole("link", { name: /^lcov\.info/ })).toContainText("LCOV");
  await expect(site.getByRole("link", { name: /^Home/ })).toHaveAttribute(
    "href",
    "/reports/lighthouse/home.report.html",
  );
});

test("a repo shows only the report types it publishes", async ({ page }) => {
  await page.goto("/reports/");
  const go = page.getByRole("region", { name: "forge-dashboard-sdk-go" });
  await expect(go.getByText("Tests", { exact: true })).toBeVisible();
  await expect(go.getByText("Coverage", { exact: true })).toBeVisible();
  await expect(go.getByText("Lighthouse", { exact: true })).toHaveCount(0);
});

test("a link's name says which repo it belongs to, and still contains its visible text", async ({
  page,
}) => {
  await page.goto("/reports/");
  const go = page.getByRole("region", { name: "forge-dashboard-sdk-go" });
  const link = go.getByRole("link", { name: /^coverage\.xml XML for forge-dashboard-sdk-go$/ });
  await expect(link).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard-sdk-go/reports/coverage/coverage.xml",
  );
});

test("the filter narrows the repos, announces the count, and says when nothing matches", async ({
  page,
}) => {
  await page.goto("/reports/");
  const filter = page.getByLabel("Filter repositories by name");
  const status = page.getByRole("status");
  const total = await page.getByRole("heading", { level: 2 }).count();
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);

  await filter.fill("scaffold-go");
  await expect(page.getByRole("heading", { level: 2 }).filter({ visible: true })).toHaveCount(1);
  await expect(status).toHaveText(`Showing 1 of ${total} repositories`);

  await filter.fill("no-such-repo");
  await expect(page.getByRole("heading", { level: 2 }).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByText("No matching repositories")).toBeVisible();

  await filter.fill("");
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);
});

test("every page's header links to the Reports page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Reports", exact: true }).first().click();
  await expect(page).toHaveURL(/\/reports\/$/);
});

for (const scheme of ["light", "dark"] as const) {
  test(`the Reports page has no axe violations in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/reports/");
    await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("the Reports page fits a 360px screen without scrolling sideways, and its links are at least 24px tall", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/reports/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const links = page.getByRole("region", { name: "alrayyes.github.io" }).getByRole("link");
  expect(await links.count()).toBeGreaterThan(5);
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
});
