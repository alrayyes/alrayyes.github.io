import { describe, expect, test } from "bun:test";

// One case per path, so a job's filter can't quietly stop covering a file
// the job reads. See scripts/changed-groups.sh for what each group gates.
function groups(...files: string[]) {
  const result = Bun.spawnSync(["bash", "scripts/changed-groups.sh"], {
    stdin: new TextEncoder().encode(`${files.join("\n")}\n`),
  });
  expect(result.exitCode).toBe(0);
  return Object.fromEntries(
    result.stdout
      .toString()
      .trim()
      .split("\n")
      .map((line) => line.split("=") as [string, string]),
  );
}

const NONE = { site: "false", deps: "false", security: "false", prose: "false" };

describe("changed-groups.sh", () => {
  test("reports every group false when nothing changed", () => {
    expect(groups()).toEqual(NONE);
  });

  test.each([
    "src/pages/index.astro",
    "src/lib/themePreference.ts",
    "public/CNAME",
    "tests/layout.spec.ts",
    "astro.config.mjs",
    "tsconfig.json",
    "package.json",
    "bun.lock",
    "biome.json",
    ".oxlintrc.json",
    "playwright.config.ts",
    "CHANGELOG.md",
    "LICENSE",
    "scripts/changed-groups.sh",
    "scripts/changed-groups.test.ts",
  ])("%s changes the site, the files lint, test and build read", (file) => {
    expect(groups(file).site).toBe("true");
  });

  test.each(["package.json", "bun.lock"])("%s changes the dependencies", (file) => {
    expect(groups(file).deps).toBe("true");
  });

  test.each([
    "src/pages/index.astro",
    "scripts/lint-prose.sh",
    ".github/workflows/prose.yml",
    ".github/PULL_REQUEST_TEMPLATE.md",
  ])("%s is scanned by semgrep", (file) => {
    expect(groups(file).security).toBe("true");
  });

  test.each([
    "README.md",
    "docs/adr/0001-deploy-to-github-pages.md",
    "src/pages/index.astro",
    "lefthook.yml",
    ".github/workflows/ci.yml",
    ".prettierrc.json",
    ".prettierignore",
    ".markdownlint-cli2.yaml",
  ])("%s changes what prettier and markdownlint check", (file) => {
    expect(groups(file).prose).toBe("true");
  });

  test("a docs-only change runs prose and nothing heavier", () => {
    expect(groups("README.md", "docs/adr/0001-deploy-to-github-pages.md")).toEqual({
      ...NONE,
      prose: "true",
    });
  });

  test("a change to the pipeline itself runs every group", () => {
    expect(groups(".github/workflows/ci.yml")).toEqual({
      site: "true",
      deps: "true",
      security: "true",
      prose: "true",
    });
  });

  test("a file no job reads changes nothing", () => {
    expect(groups("docs/ui-audit/stitch-home-full.png", ".gitignore")).toEqual(NONE);
  });

  test("another script changes the security scan but not the site", () => {
    expect(groups("scripts/lint-prose.sh")).toEqual({ ...NONE, security: "true" });
  });

  test("any one matching file among many switches its group on", () => {
    expect(groups("README.md", "src/lib/licenseSections.ts").site).toBe("true");
  });
});
