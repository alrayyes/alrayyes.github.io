import { expect, test } from "@playwright/test";

// Axe can't run with scripts off, so this asserts the server-rendered markup
// directly; the Storybook axe scan covers the same markup with no exceptions.
test("the theme toggle has an accessible name before any script runs", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("#theme-toggle")).toHaveAttribute("aria-label", /\S/);
  await context.close();
});
