import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// The Playwright image ships the browser build that one Playwright release
// expects, so its tag must name the @playwright/test version we install.
// Playwright refuses to launch a browser from a different release. Dependabot
// bumps the npm package; this fails until the image in ci.yml follows it.
const ci = readFileSync(".github/workflows/ci.yml", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.devDependencies["@playwright/test"];

test("every job that runs Playwright uses the image for the installed version", () => {
  const images = [...ci.matchAll(/image: (mcr\.microsoft\.com\/playwright:\S+)/g)].map((m) => m[1]);
  expect(images.length).toBe(2);
  for (const image of images) {
    expect(image).toMatch(
      new RegExp(`^mcr\\.microsoft\\.com/playwright:v${version}-noble@sha256:[0-9a-f]{64}$`),
    );
  }
});

test("no job still downloads the browser itself", () => {
  expect(ci).not.toContain("playwright install");
});
