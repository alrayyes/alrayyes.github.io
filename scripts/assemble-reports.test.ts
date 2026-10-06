import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assembleReports, renderIndex } from "./assemble-reports";

let root: string;
let out: string;

async function put(path: string, body = "x") {
  const file = join(root, path);
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, body);
}

async function seed({ without }: { without?: string } = {}) {
  const files = [
    "junit/unit.xml",
    "playwright-report/junit.xml",
    "playwright-report/html/index.html",
    "coverage/lcov.info",
    "coverage/coverage.xml",
    "coverage/html/index.html",
    "coverage/html/src/index.html",
    "lighthouse/home.report.html",
    "lighthouse/home.report.json",
    "lighthouse/privacy.report.html",
    "lighthouse/privacy.report.json",
  ];
  for (const file of files) if (file !== without) await put(file, file);
}

const read = (path: string) => readFile(join(out, path), "utf8");

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "reports-in-"));
  out = join(await mkdtemp(join(tmpdir(), "reports-out-")), "reports");
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  await rm(join(out, ".."), { recursive: true, force: true });
});

describe("assembleReports", () => {
  test("puts each runner's JUnit XML under tests/ and the Cobertura XML under coverage/", async () => {
    await seed();
    await assembleReports({ root, out });
    expect(await read("tests/unit.xml")).toBe("junit/unit.xml");
    expect(await read("tests/playwright.xml")).toBe("playwright-report/junit.xml");
    expect(await read("coverage/coverage.xml")).toBe("coverage/coverage.xml");
    expect(await read("coverage/lcov.info")).toBe("coverage/lcov.info");
  });

  test("serves the HTML coverage view from coverage/ itself, keeping its subpages", async () => {
    await seed();
    await assembleReports({ root, out });
    expect(await read("coverage/index.html")).toBe("coverage/html/index.html");
    expect(await read("coverage/src/index.html")).toBe("coverage/html/src/index.html");
  });

  test("puts each page's Lighthouse HTML and JSON under lighthouse/", async () => {
    await seed();
    await assembleReports({ root, out });
    expect(await read("lighthouse/home.report.html")).toBe("lighthouse/home.report.html");
    expect(await read("lighthouse/privacy.report.json")).toBe("lighthouse/privacy.report.json");
  });

  test("lists every page's Lighthouse reports in lighthouse/index.html", async () => {
    await seed();
    await assembleReports({ root, out });
    const html = await read("lighthouse/index.html");
    expect(html).toContain('href="home.report.html"');
    expect(html).toContain('href="home.report.json"');
    expect(html).toContain('href="privacy.report.html"');
    expect(html).toContain('href="privacy.report.json"');
  });

  test("refuses to publish when Lighthouse produced no reports", async () => {
    await seed();
    await rm(join(root, "lighthouse"), { recursive: true });
    await expect(assembleReports({ root, out })).rejects.toThrow("lighthouse");
  });

  test("refuses to publish a Lighthouse HTML report that has no JSON beside it", async () => {
    await seed({ without: "lighthouse/privacy.report.json" });
    await expect(assembleReports({ root, out })).rejects.toThrow("lighthouse/privacy.report.json");
  });

  test("keeps the Playwright HTML report under tests/playwright/", async () => {
    await seed();
    await assembleReports({ root, out });
    expect(await read("tests/playwright/index.html")).toBe("playwright-report/html/index.html");
  });

  test("writes an index in tests/ and none at the top, since the site's Reports page is the top", async () => {
    await seed();
    await assembleReports({ root, out });
    await expect(readFile(join(out, "index.html"), "utf8")).rejects.toThrow();
    const tests = await read("tests/index.html");
    expect(tests).toContain('href="unit.xml"');
    expect(tests).toContain('href="playwright.xml"');
    expect(tests).toContain('href="playwright/"');
  });

  test("leaves the Playwright HTML link out when that report wasn't produced", async () => {
    await seed({ without: "playwright-report/html/index.html" });
    await assembleReports({ root, out });
    expect(await read("tests/index.html")).not.toContain("playwright/");
  });

  test.each([
    "junit/unit.xml",
    "playwright-report/junit.xml",
    "coverage/lcov.info",
    "coverage/coverage.xml",
    "coverage/html/index.html",
  ])("refuses to publish a partial set when %s is missing", async (missing) => {
    await seed({ without: missing });
    await expect(assembleReports({ root, out })).rejects.toThrow(missing);
  });
});

describe("renderIndex", () => {
  test("is a titled, language-tagged page with a heading and a link per entry", () => {
    const html = renderIndex("Reports", [{ label: "Coverage", href: "coverage/" }]);
    expect(html).toStartWith("<!doctype html>");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<title>Reports</title>");
    expect(html).toContain("<h1>Reports</h1>");
    expect(html).toContain('<a href="coverage/">Coverage</a>');
  });

  test("escapes markup in labels and hrefs", () => {
    const html = renderIndex("A & B", [{ label: "<b>", href: 'x"y' }]);
    expect(html).toContain("<title>A &amp; B</title>");
    expect(html).toContain('<a href="x&quot;y">&lt;b&gt;</a>');
  });
});
