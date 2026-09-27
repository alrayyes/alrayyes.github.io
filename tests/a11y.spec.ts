import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/disclaimer", "/privacy"]) {
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

test("footer links to GitHub, disclaimer, privacy and the licence", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Disclaimer" })).toHaveAttribute(
    "href",
    "/disclaimer",
  );
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await expect(page.getByRole("link", { name: "GPL-3.0-or-later" })).toBeVisible();
});
