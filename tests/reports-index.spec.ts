import { expect, test } from "@playwright/test";

test("the reports intro keeps a space before the front page link", async ({ page }) => {
  await page.goto("/reports/");
  const intro = page.locator("main p", { hasText: "Every repo's reports" });
  await expect(intro).toHaveText(/listed on the front page, A to Z/);
});
