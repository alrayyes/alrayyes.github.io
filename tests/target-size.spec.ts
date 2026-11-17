import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The baseline in axe.ts runs WCAG 2.1 tags, and target-size is a 2.2 rule
// (SC 2.5.8). Lighthouse runs it at its 412px mobile width. Repo rows skip
// rendering off screen (content-visibility), and a skipped row whose links
// reach past its placeholder height makes them overlap the next row's, so a
// phone-width check has to cover the narrowest widths, where rows wrap most.
for (const width of [320, 412, 640, 768]) {
  test(`the front page has no overlapping touch targets at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 823 } });
    const page = await context.newPage();
    await page.goto("/");
    const results = await new AxeBuilder({ page }).withRules(["target-size"]).analyze();
    expect(results.violations.flatMap((v) => v.nodes.map((n) => n.target.join(" ")))).toEqual([]);
    await context.close();
  });
}
