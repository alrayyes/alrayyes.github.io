import { describe, expect, test } from "bun:test";
import { reportLinks } from "./reportLinks";

describe("reportLinks", () => {
  test("returns nothing when there are no reports", () => {
    expect(reportLinks(undefined)).toEqual([]);
    expect(reportLinks({})).toEqual([]);
  });

  test("labels each key and keeps a fixed order whatever the input order", () => {
    const links = reportLinks({
      coverageXml: "https://apis.ryankes.eu/x/reports/coverage/coverage.xml",
      lighthouse: "https://apis.ryankes.eu/x/reports/lighthouse/",
      coverage: "https://apis.ryankes.eu/x/reports/coverage/",
      tests: "https://apis.ryankes.eu/x/reports/tests/unit.xml",
    });
    expect(links.map((l) => l.label)).toEqual([
      "Lighthouse",
      "Test results",
      "Coverage",
      "Coverage (XML)",
    ]);
    expect(links[3]?.href).toBe("https://apis.ryankes.eu/x/reports/coverage/coverage.xml");
  });

  test("skips a key that is absent", () => {
    const links = reportLinks({ coverageXml: "https://apis.ryankes.eu/x/c.xml" });
    expect(links).toEqual([{ label: "Coverage (XML)", href: "https://apis.ryankes.eu/x/c.xml" }]);
  });
});
