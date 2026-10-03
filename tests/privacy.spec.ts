import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("the privacy page opens with a summary, then one titled section per topic", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expectNoAxeViolations(page);
  const summary = page.getByRole("region", { name: "At a glance" });
  await expect(summary).toContainText("No cookies");
  await expect(summary).toContainText("No tracking scripts");
  await expect(summary).toContainText("No third-party requests");

  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(headings).toEqual([
    "At a glance",
    "How the site is built",
    "Fonts and third parties",
    "Links to other sites",
    "What's stored in your browser",
  ]);
});

test("the privacy page says the theme choice is stored in the browser", async ({ page }) => {
  await page.goto("/privacy");
  const section = page.getByRole("region", { name: "What's stored in your browser" });
  await expect(section).toContainText("theme");
  await expect(section).toContainText("localStorage");
  await expect(page.getByText("stores nothing in your browser")).toHaveCount(0);
});

test("the privacy page doesn't scroll horizontally at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/privacy");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
