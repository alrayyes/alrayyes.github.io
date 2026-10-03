import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

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

  const pipelineAnalytics = page.getByRole("region", {
    name: "pipeline-analytics",
  });
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
  await expect(page.getByText("GNU GENERAL PUBLIC LICENSE").first()).toBeVisible();
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
  await expectNoAxeViolations(page);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

for (const [path, name] of [
  ["/changelog", "changelog"],
  ["/license", "license"],
  ["/privacy", "privacy"],
  ["/disclaimer", "disclaimer"],
] as const) {
  test(`${path} header names the current page and links back to the index`, async ({ page }) => {
    await page.goto(path);
    const header = page.locator("header").first();
    await expect(header.locator('[aria-current="page"]')).toHaveText(name);
    await expect(header.getByRole("link", { name: "APIs", exact: true })).toHaveAttribute(
      "href",
      "/",
    );
  });
}

test("the homepage header shows no current-page marker", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header").first().locator('[aria-current="page"]')).toHaveCount(0);
});

test("the header fits a 375px viewport without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/disclaimer");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("each API card has an SDKs heading and a repo and docs link per language", async ({
  page,
}) => {
  await page.goto("/");
  for (const api of ["hush-hush", "forge-dashboard", "pipeline-analytics"]) {
    const card = page.getByRole("region", { name: api });
    await expect(card.getByRole("heading", { name: "SDKs", level: 3 })).toBeVisible();
    for (const language of ["PHP", "Node.js / TypeScript", "Python", "Go"]) {
      const row = card.getByRole("listitem").filter({ hasText: language });
      await expect(row.getByRole("link", { name: "repo" })).toBeVisible();
      await expect(row.getByRole("link", { name: "docs" })).toBeVisible();
    }
  }
});

test("API cards don't scroll horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
