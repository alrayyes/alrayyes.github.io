import { expect, test } from "@playwright/test";

test("the license page has a table of contents that jumps to each section", async ({ page }) => {
  await page.goto("/license");
  const toc = page.getByRole("navigation", { name: "Table of contents" });
  await expect(toc.getByRole("link")).toHaveCount(20);

  for (const title of [
    "0. Definitions",
    "15. Disclaimer of Warranty",
    "How to Apply These Terms",
  ]) {
    const link = toc.getByRole("link", { name: title });
    const href = await link.getAttribute("href");
    expect(href).toMatch(/^#.+/);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator(href as string)).toBeVisible();
  }
});

test("the license text is still complete with the table of contents", async ({ page }) => {
  await page.goto("/license");
  await expect(page.getByText("GNU GENERAL PUBLIC LICENSE").first()).toBeVisible();
  await expect(page.getByText("END OF TERMS AND CONDITIONS")).toBeVisible();
});

test("the license page doesn't scroll horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/license");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the table of contents reads down each column at 900px", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/license");
  const links = page.getByRole("navigation", { name: "Table of contents" }).getByRole("link");
  const first = await links.nth(0).boundingBox();
  const second = await links.nth(1).boundingBox();
  expect(second?.y).toBeGreaterThan(first?.y ?? 0);
  expect(second?.x).toBe(first?.x);
});
