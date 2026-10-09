import { describe, expect, test } from "bun:test";
import { directory, filesOf } from "./repoReportPage";
import type { RepoSection } from "./reportsIndex";

const section: RepoSection = {
  name: "svc",
  kind: "API",
  repo: "https://github.com/alrayyes/svc",
  files: [
    {
      group: "Tests",
      label: "unit.xml",
      format: "JUnit XML",
      href: "https://x.test/svc/reports/tests/unit.xml",
    },
    {
      group: "Coverage",
      label: "HTML view",
      format: "HTML",
      href: "https://x.test/svc/reports/coverage/",
    },
  ],
};

describe("filesOf", () => {
  test("returns the files of one group", () => {
    expect(filesOf(section, "Tests").map((file) => file.label)).toEqual(["unit.xml"]);
    expect(filesOf(section, "Lighthouse")).toEqual([]);
  });
});

describe("directory", () => {
  test("is the directory of the group's first file, whether it names a file or a directory", () => {
    expect(directory(section, "Tests")).toBe("https://x.test/svc/reports/tests/");
    expect(directory(section, "Coverage")).toBe("https://x.test/svc/reports/coverage/");
  });

  test("is undefined when the repo publishes nothing in that group", () => {
    expect(directory(section, "Lighthouse")).toBeUndefined();
  });
});
