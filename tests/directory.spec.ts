import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const row = (page: import("@playwright/test").Page, name: string) =>
  page.locator(`[data-repo-row][data-name="${name}"]`);

const section = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("region", { name, exact: true });

test("the front page lists every repo once, with SDKs under their API, each section A to Z", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Repositories" })).toBeVisible();

  const names = await page
    .locator("[data-repo-row]")
    .evaluateAll((rows) => rows.map((el) => (el as HTMLElement).dataset.name ?? ""));
  expect(names).toContain("alrayyes.github.io");
  expect(names).toContain("Hush-Hush");
  expect(names).toContain("scaffold-go-api");
  expect(new Set(names).size).toBe(names.length);
  for (const heading of ["washy-washy", "Scaffolds", "Everything else"]) {
    const topLevel = await section(page, heading)
      .locator("[data-repo-row]:not(ul ul [data-repo-row])")
      .evaluateAll((rows) => rows.map((el) => (el as HTMLElement).dataset.name ?? ""));
    const sorted = [...topLevel].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    expect(topLevel).toEqual(sorted);
  }
});

test("an API lists its SDKs under it", async ({ page }) => {
  await page.goto("/");
  const sdks = page.getByRole("list", { name: "SDKs for forge-dashboard" });
  await expect(sdks.locator('[data-repo-row][data-kind="SDK"]').first()).toBeVisible();
  await expect(page.locator('[data-group-section] > ul > li > div[data-kind="SDK"]')).toHaveCount(
    0,
  );
});

test("every scaffold sits in the Scaffolds section, under its description", async ({ page }) => {
  await page.goto("/");
  const group = section(page, "Scaffolds");
  await expect(group.getByText("Starter templates new repos are generated from.")).toBeVisible();
  await expect(group.locator('[data-repo-row][data-name="scaffold-go-api"]')).toHaveCount(1);
  await expect(page.locator('[data-repo-row][data-kind="Scaffold"]')).toHaveCount(
    await group.locator('[data-repo-row][data-kind="Scaffold"]').count(),
  );
});

test("the groups repos.json declares are cards with a type label and a repo count", async ({
  page,
}) => {
  await page.goto("/");
  const washy = section(page, "washy-washy");
  await expect(washy.getByText("Product", { exact: true })).toBeVisible();
  await expect(washy.locator("[data-group-count]")).toHaveText("4 repos");
  await expect(washy.locator("[data-repo-row]")).toHaveCount(4);
  for (const name of ["hush-hush", "forgejo", "obsidian", "movie-planner"]) {
    await expect(section(page, name).locator("[data-repo-row]").first()).toBeVisible();
  }
  const api = section(page, "forge-dashboard");
  await expect(api.getByText("API and SDKs", { exact: true })).toBeVisible();
  await expect(api.getByRole("list", { name: "SDKs for forge-dashboard" })).toBeVisible();
});

test("a repo in no group is under Everything else", async ({ page }) => {
  await page.goto("/");
  await expect(
    section(page, "Everything else").locator('[data-repo-row][data-name="alrayyes.github.io"]'),
  ).toHaveCount(1);
});

test("a card says how many of its repos the filter leaves, and goes when none match", async ({
  page,
}) => {
  await page.goto("/");
  const washy = section(page, "washy-washy");
  await page.getByLabel("Filter repositories by name").fill("washy-washy-web");
  await expect(washy.locator("[data-group-count]")).toHaveText("1 of 4 shown");
  await page.getByLabel("Filter repositories by name").fill("scaffold-go");
  await expect(washy).toBeHidden();
  await page.getByRole("button", { name: "Clear filters" }).first().click();
  await expect(washy.locator("[data-group-count]")).toHaveText("4 repos");
});

test("each repo's name links to its repo", async ({ page }) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("heading").getByRole("link"),
  ).toHaveAttribute("href", "https://github.com/alrayyes/forge-dashboard-sdk-go");
});

test("Lighthouse and Test results are the primary links, each with an icon and a text label, and go to the repo's report page", async ({
  page,
}) => {
  await page.goto("/");
  const analytics = row(page, "pipeline-analytics");
  const lighthouse = analytics.getByRole("link", { name: /^Lighthouse/ });
  const tests = analytics.getByRole("link", { name: /^Test results/ });
  await expect(lighthouse).toHaveAttribute("href", "/reports/pipeline-analytics/lighthouse/");
  await expect(tests).toHaveAttribute("href", "/reports/pipeline-analytics/tests/");
  for (const link of [lighthouse, tests]) {
    await expect(link.locator("svg[aria-hidden='true']")).toHaveCount(1);
  }
});

test("coverage and the raw files are secondary links, each with an icon", async ({ page }) => {
  await page.goto("/");
  const go = row(page, "forge-dashboard-sdk-go");
  const coverage = go.getByRole("link", { name: /^Coverage/ });
  await expect(coverage).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard-sdk-go/reports/coverage/",
  );
  await expect(coverage.locator("svg[aria-hidden='true']")).toHaveCount(1);
  const xml = go.getByRole("link", { name: /^coverage\.xml/ });
  await expect(xml).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/forge-dashboard-sdk-go/reports/coverage/coverage.xml",
  );
  await expect(xml.locator("svg[aria-hidden='true']")).toHaveCount(1);
});

test("a repo with no Lighthouse report has no Lighthouse link", async ({ page }) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("link", { name: /^Lighthouse/ }),
  ).toHaveCount(0);
});

test("a link's name says which repo it belongs to, and still starts with its visible text", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("link", {
      name: "Coverage for forge-dashboard-sdk-go",
    }),
  ).toBeVisible();
});

test("this site's own row links its report files", async ({ page }) => {
  await page.goto("/");
  const site = row(page, "alrayyes.github.io");
  await expect(site.getByRole("link", { name: /^coverage\.xml/ })).toHaveAttribute(
    "href",
    "/reports/coverage/coverage.xml",
  );
  await expect(site.getByRole("link", { name: /^Lighthouse/ })).toHaveAttribute(
    "href",
    "/reports/alrayyes.github.io/lighthouse/",
  );
});

test("an API row keeps its OpenAPI spec and docs links", async ({ page }) => {
  await page.goto("/");
  const hush = row(page, "Hush-Hush");
  await expect(hush.getByRole("link", { name: /^OpenAPI spec/ })).toBeVisible();
  await expect(hush.getByRole("link", { name: /^Docs/ })).toHaveAttribute(
    "href",
    "https://apis.ryankes.eu/Hush-Hush/docs/api/#description/introduction",
  );
});

test("the filter narrows the repos, announces the count, and says when nothing matches", async ({
  page,
}) => {
  await page.goto("/");
  const filter = page.getByLabel("Filter repositories by name");
  const status = page.getByRole("status");
  const total = await page.locator("[data-repo-row]").count();
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);

  await filter.fill("scaffold-go");
  await expect(page.locator("[data-repo-row]:visible")).toHaveCount(1);
  await expect(status).toHaveText(`Showing 1 of ${total} repositories`);
  await expect(page.getByRole("heading", { level: 2, name: "H", exact: true })).toBeHidden();

  await filter.fill("no-such-repo");
  await expect(page.locator("[data-repo-row]:visible")).toHaveCount(0);
  await expect(page.getByText("No matching repositories")).toBeVisible();

  await filter.fill("");
  await expect(status).toHaveText(`Showing ${total} of ${total} repositories`);
});

test("the kind chips filter by API, SDK, Scaffold or Other", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Scaffold", exact: true }).click();
  await expect(page.getByRole("button", { name: "Scaffold", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const kinds = await page
    .locator("[data-repo-row]:visible")
    .evaluateAll((rows) => rows.map((el) => (el as HTMLElement).dataset.kind));
  expect(kinds.length).toBeGreaterThan(0);
  expect(new Set(kinds)).toEqual(new Set(["Scaffold"]));

  await page.getByRole("button", { name: "All", exact: true }).click();
  expect(await page.locator("[data-repo-row]:visible").count()).toBeGreaterThan(kinds.length);
});

test("each row shows its README badges in order, each linking out, with the badge's label as alt text", async ({
  page,
}) => {
  await page.goto("/");
  const badges = page.getByRole("list", { name: "Badges for forge-dashboard", exact: true });
  const links = badges.getByRole("link");
  await expect(links).toHaveCount(5);
  await expect(links.first()).toHaveAttribute(
    "href",
    "https://github.com/alrayyes/forge-dashboard/actions/workflows/ci.yml",
  );
  await expect(links.first().getByRole("img", { name: "CI" })).toHaveAttribute(
    "src",
    "https://github.com/alrayyes/forge-dashboard/actions/workflows/ci.yml/badge.svg?branch=main",
  );
  await expect(links.nth(2).getByRole("img")).toHaveAttribute("alt", "licence");
});

test("the badges sit above the coverage and raw-file links, and a nested SDK row has its own", async ({
  page,
}) => {
  await page.goto("/");
  const api = row(page, "forge-dashboard");
  const strip = api.getByRole("list", { name: "Badges for forge-dashboard", exact: true });
  const coverage = api.getByRole("link", { name: /^Coverage/ });
  const stripBox = await strip.boundingBox();
  const coverageBox = await coverage.boundingBox();
  expect(stripBox?.y ?? 0).toBeLessThan(coverageBox?.y ?? 0);
  await expect(
    row(page, "forge-dashboard-sdk-go").getByRole("list", {
      name: "Badges for forge-dashboard-sdk-go",
    }),
  ).toBeVisible();
});

test("a repo whose README has no badges gets no badge list", async ({ page }) => {
  await page.goto("/");
  await expect(row(page, "wiki").getByRole("list", { name: /^Badges for/ })).toHaveCount(0);
});

const ci = (page: import("@playwright/test").Page) => page.getByLabel("CI", { exact: true });
const licence = (page: import("@playwright/test").Page) =>
  page.getByLabel("Licence", { exact: true });
const visible = (page: import("@playwright/test").Page) => page.locator("[data-repo-row]:visible");
// The rows that match themselves: an API stays visible while one of its SDKs
// matches, so a visible row with a visible SDK under it is only a parent.
const matching = (page: import("@playwright/test").Page) =>
  visible(page).evaluateAll((rows) =>
    rows
      .filter((el) => !el.parentElement?.querySelector(":scope > ul [data-repo-row]:not([hidden])"))
      .map((el) => (el as HTMLElement).dataset),
  );

test("the CI filter offers only Any, Passing and Failing", async ({ page }) => {
  await page.goto("/");
  await expect(ci(page).locator("option")).toHaveText(["Any", "Passing", "Failing"]);
});

test("the CI filter narrows to repos whose latest CI run passed, or failed", async ({ page }) => {
  await page.goto("/");
  const total = await visible(page).count();

  await ci(page).selectOption("Passing");
  const passing = (await matching(page)).map((data) => data.ciStatus);
  expect(passing.length).toBeGreaterThan(0);
  expect(new Set(passing)).toEqual(new Set(["passing"]));
  await expect(visible(page).first()).toBeVisible();

  await ci(page).selectOption("Failing");
  const failing = (await matching(page)).map((data) => data.ciStatus);
  expect(failing.every((status) => status === "failing")).toBe(true);
  await expect(page.getByRole("status")).toHaveText(
    new RegExp(`^Showing ${failing.length} of ${total} repositories`),
  );

  await ci(page).selectOption("Any");
  await expect(visible(page)).toHaveCount(total);
});

test("a row says whether its CI passed, in words and an icon, not colour alone", async ({
  page,
}) => {
  await page.goto("/");
  const label = row(page, "forge-dashboard").locator("[data-ci-status-label]");
  await expect(label).toHaveText("CI passing");
  await expect(label.locator("svg[aria-hidden='true']")).toHaveCount(1);
  await expect(row(page, "forge-dashboard")).toHaveAttribute("data-ci-status", "passing");
  await expect(row(page, "wiki").locator("[data-ci-status-label]")).toHaveCount(0);
  await expect(row(page, "wiki")).toHaveAttribute("data-ci-status", "unknown");
});

test("the page says when the CI status was read", async ({ page }) => {
  await page.goto("/");
  const stamp = page.locator("time[data-ci-checked]");
  await expect(stamp).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
  await expect(page.getByText(/^CI status read /)).toBeVisible();
});

test("the licence filter lists each licence in the data and narrows to the one chosen", async ({
  page,
}) => {
  await page.goto("/");
  await expect(licence(page).locator("option")).toHaveText([
    "Any",
    "AGPL-3.0",
    "GPL-3.0",
    "GPL-3.0-or-later",
    "MIT",
    "Unlicensed",
  ]);

  await licence(page).selectOption("MIT");
  const shown = (await matching(page)).map((data) => data.license);
  expect(shown.length).toBeGreaterThan(0);
  expect(new Set(shown)).toEqual(new Set(["MIT"]));
});

test("CI, licence, kind and text filters combine, and the count follows", async ({ page }) => {
  await page.goto("/");
  const status = page.getByRole("status");
  const total = await page.locator("[data-repo-row]").count();

  await licence(page).selectOption("MIT");
  await ci(page).selectOption("Passing");
  await page.getByRole("button", { name: "SDK", exact: true }).click();
  await page.getByLabel("Filter repositories by name").fill("hush");
  const names = (await matching(page)).map((data) => data.name);
  expect(names.sort()).toEqual([
    "hush-hush-go",
    "hush-hush-node",
    "hush-hush-php",
    "hush-hush-python",
  ]);
  await expect(status).toHaveText(`Showing 4 of ${total} repositories`);
});

test("active filters show as removable chips, and Clear filters resets them all", async ({
  page,
}) => {
  await page.goto("/");
  const active = page.getByRole("list", { name: "Active filters" });
  await expect(active).toBeHidden();

  await ci(page).selectOption("Passing");
  await licence(page).selectOption("GPL-3.0-or-later");
  await expect(active.getByRole("listitem")).toHaveText([
    /CI: Passing/,
    /Licence: GPL-3.0-or-later/,
  ]);

  await active.getByRole("button", { name: /Remove filter CI: Passing/ }).click();
  await expect(ci(page)).toHaveValue("Any");
  await expect(active.getByRole("listitem")).toHaveCount(1);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(licence(page)).toHaveValue("Any");
  await expect(active).toBeHidden();
  await expect(visible(page)).toHaveCount(await page.locator("[data-repo-row]").count());
});

test("an empty result offers a Clear filters button", async ({ page }) => {
  await page.goto("/");
  await licence(page).selectOption("AGPL-3.0");
  await page.getByRole("button", { name: "Scaffold", exact: true }).click();
  await expect(page.getByText("No matching repositories")).toBeVisible();
  await page.locator("#directory-empty").getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("No matching repositories")).toBeHidden();
  await expect(visible(page).first()).toBeVisible();
});

test("the badge links are at least 24px tall, and the new controls at least 36px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  for (const link of await row(page, "forge-dashboard")
    .getByRole("list", { name: "Badges for forge-dashboard", exact: true })
    .getByRole("link")
    .all()) {
    expect((await link.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
  for (const control of [ci(page), licence(page)]) {
    expect((await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(36);
  }
});

const unreported = [
  "bun-with-git",
  "cloudflare-wrangler",
  "deploy-ssh",
  "forge-dashboard-e2e-fixture",
  "hush-hush-action",
  "ltex-cli-plus",
  "scaffold-arch-package",
  "scaffold-deb-package",
  "scaffold-nix-package",
  "scaffold-rpm-package",
  "wiki",
];

test("every active repo is listed, including those that publish no reports", async ({ page }) => {
  await page.goto("/");
  for (const name of unreported) await expect(row(page, name)).toHaveCount(1);
  await expect(row(page, "bun-with-git").getByRole("link", { name: /^Lighthouse/ })).toHaveCount(0);
  await expect(row(page, "bun-with-git").getByRole("link", { name: /^Test results/ })).toHaveCount(
    0,
  );
});

test("a repo with no reports still shows its badges and takes part in the filters", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    row(page, "hush-hush-action").getByRole("list", { name: "Badges for hush-hush-action" }),
  ).toBeVisible();
  await page.getByLabel("Filter repositories by name").fill("hush-hush-action");
  await expect(visible(page)).toHaveCount(1);
});

test("the packaging templates sit in the Scaffolds section", async ({ page }) => {
  await page.goto("/");
  const group = section(page, "Scaffolds");
  for (const name of unreported.filter((name) => name.startsWith("scaffold-"))) {
    await expect(group.locator(`[data-repo-row][data-name="${name}"]`)).toHaveCount(1);
  }
});

test("the intro doesn't claim every repo publishes reports", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header p")).not.toContainText("that publishes");
});

test("a repo with no reports has no report page", async ({ page }) => {
  const response = await page.goto("/reports/bun-with-git/");
  expect(response?.status()).toBe(404);
});

test("a README's unlinked and reference-style badges show too", async ({ page }) => {
  await page.goto("/");
  const watchdog = row(page, "bot-pr-watchdog").getByRole("list", {
    name: "Badges for bot-pr-watchdog",
  });
  await expect(watchdog.getByRole("img", { name: "CI" })).toHaveAttribute(
    "src",
    "https://github.com/alrayyes/bot-pr-watchdog/actions/workflows/ci.yml/badge.svg",
  );
  const fugit = row(page, "tempus-fugit").getByRole("list", { name: "Badges for tempus-fugit" });
  const alts = await fugit
    .getByRole("img")
    .evaluateAll((imgs) => imgs.map((img) => img.getAttribute("alt")));
  expect(alts).toEqual(["pipeline status", "coverage", "licence"]);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole list is there and the filter isn't", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("[data-repo-row]:visible").count()).toBeGreaterThan(15);
    await expect(page.getByLabel("Filter repositories by name")).toBeHidden();
  });
});

test("/reports/ points to the front page", async ({ page }) => {
  await page.goto("/reports/");
  await expect(page.getByRole("link", { name: "front page" })).toHaveAttribute("href", "/");
});

for (const scheme of ["light", "dark"] as const) {
  test(`the front page has no axe violations in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Repositories" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

for (const scheme of ["light", "dark"] as const) {
  test(`the front page has no axe violations in ${scheme} mode with filters active`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/");
    await ci(page).selectOption("Passing");
    await licence(page).selectOption("GPL-3.0");
    await expect(page.getByRole("list", { name: "Active filters" })).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test("the front page fits a 360px screen without scrolling sideways, and its links are at least 24px tall", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  for (const link of await row(page, "alrayyes.github.io").getByRole("link").all()) {
    const box = await link.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
  }
});

test("the grouped front page has no axe violations at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/");
  await expectNoAxeViolations(page);
});
