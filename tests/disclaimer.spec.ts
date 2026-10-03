import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("the disclaimer is split into numbered sections, one per topic", async ({ page }) => {
  await page.goto("/disclaimer");
  await expectNoAxeViolations(page);
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings).toEqual([
    "1. Independence and trademarks",
    "2. Source of truth",
    "3. Warranty and liability",
  ]);
});

test("the source-of-truth section says the repo is the authority and lists where to look", async ({
  page,
}) => {
  await page.goto("/disclaimer");
  const section = page.getByRole("region", { name: "2. Source of truth" });
  await expect(section).toContainText("the repo is always the authority");
  const items = await section.getByRole("listitem").allTextContents();
  expect(items.join(" ")).toContain("Repositories");
  expect(items.join(" ")).toContain("OpenAPI specs");
  expect(items.join(" ")).toContain("SDK docs");
});

test("the warranty section links the licence page", async ({ page }) => {
  await page.goto("/disclaimer");
  const section = page.getByRole("region", { name: "3. Warranty and liability" });
  await expect(section.getByRole("link", { name: "GPL-3.0-or-later" })).toHaveAttribute(
    "href",
    "/license",
  );
});

test("the disclaimer page doesn't scroll horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/disclaimer");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
