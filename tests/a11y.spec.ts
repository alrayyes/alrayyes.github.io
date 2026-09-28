import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/disclaimer", "/privacy", "/changelog", "/license"]) {
  test(`${path} has no detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("lists every API with a repo, spec and at least one SDK link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "hush-hush" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "forge-dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "pipeline-analytics" })).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenAPI spec" }).first()).toBeVisible();
});

test("each API's docs link points at that API's generated docs on apis.ryankes.eu, where published", async ({
  page,
}) => {
  await page.goto("/");

  const hushHush = page.getByRole("region", { name: "hush-hush" });
  await expect(hushHush.getByRole("link", { name: "API docs" })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/Hush-Hush/docs/api/#description/introduction",
  );

  const forgeDashboard = page.getByRole("region", { name: "forge-dashboard" });
  await expect(forgeDashboard.getByRole("link", { name: "API docs" })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard/docs/api/#description/introduction",
  );

  const pipelineAnalytics = page.getByRole("region", { name: "pipeline-analytics" });
  await expect(pipelineAnalytics.getByRole("link", { name: "API docs" })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/pipeline-analytics/docs/api/#description/introduction",
  );
});

test("footer links to GitHub, disclaimer, privacy and the licence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Disclaimer" })).toHaveAttribute(
    "href",
    "/disclaimer",
  );
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await expect(page.getByRole("link", { name: "GPL-3.0-or-later" })).toHaveAttribute(
    "href",
    "/license",
  );
  await expect(page.getByRole("link", { name: /^v\d/ })).toHaveAttribute("href", "/changelog");
});

test("changelog and license pages render this repo's own files, not a GitHub link-out", async ({
  page,
}) => {
  await page.goto("/changelog");
  await expect(page.getByRole("heading", { name: "Changelog", level: 1 })).toBeVisible();

  await page.goto("/license");
  await expect(page.getByRole("heading", { name: "License", level: 1 })).toBeVisible();
  await expect(page.getByText("GNU GENERAL PUBLIC LICENSE")).toBeVisible();
});

test("icon links meet the 24x24 CSS px minimum target size (WCAG 2.5.8)", async ({ page }) => {
  await page.goto("/");
  for (const name of ["GitHub repo", "OpenAPI spec", "API docs"]) {
    const box = await page.getByRole("link", { name }).first().boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
  for (const name of ["repo", "docs"]) {
    const box = await page.getByRole("link", { name, exact: true }).first().boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
});

test("header links back to home from a subpage", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("link", { name: "alrayyes/APIs" }).click();
  await expect(page).toHaveURL("/");
});

test("theme toggle overrides the OS preference and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
