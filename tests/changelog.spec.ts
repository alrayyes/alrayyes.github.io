import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("each changelog release heading shows its version and date", async ({ page }) => {
  await page.goto("/changelog");
  await expectNoAxeViolations(page);
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings.length).toBeGreaterThan(0);
  for (const heading of headings) {
    expect(heading).toMatch(/^\d+\.\d+\.\d+ \(\d{4}-\d{2}-\d{2}\)$/);
  }
});

test("changelog entries sit under type headings", async ({ page }) => {
  await page.goto("/changelog");
  const types = await page.getByRole("heading", { level: 3 }).allTextContents();
  expect(types.length).toBeGreaterThan(0);
  for (const type of types) {
    expect(["Features", "Bug Fixes", "Performance Improvements", "Reverts"]).toContain(type);
  }
});

test("the changelog page doesn't scroll horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/changelog");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
