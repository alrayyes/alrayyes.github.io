import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("API card links are bordered chips and the API docs chip stands out", async ({ page }) => {
  await page.goto("/");
  await expectNoAxeViolations(page);
  const card = page.getByRole("region", { name: "hush-hush" });
  const style = (name: string) =>
    card.getByRole("link", { name, exact: true }).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        border: Number.parseFloat(s.borderTopWidth),
        background: s.backgroundColor,
      };
    });

  const repo = await style("GitHub repo");
  const spec = await style("OpenAPI spec");
  const docs = await style("API docs");
  for (const chip of [repo, spec, docs]) {
    expect(chip.border).toBeGreaterThan(0);
  }
  expect(docs.background).not.toEqual(repo.background);
  expect(spec.background).toEqual(repo.background);
});
