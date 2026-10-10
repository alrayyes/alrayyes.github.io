import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("a path that doesn't exist answers 404 with a way back", async ({ page }) => {
  const response = await page.goto("/no/such/page/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: "Back to the directory" })).toHaveAttribute(
    "href",
    "/",
  );
  await expect(main.getByRole("link", { name: "Browse the reports" })).toHaveAttribute(
    "href",
    "/reports/",
  );
});

test("the 404 page has no axe violations in either theme or at 375px", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/no/such/page/");
    await expectNoAxeViolations(page);
  }
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/no/such/page/");
  await expectNoAxeViolations(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
