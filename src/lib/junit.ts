// What a JUnit XML file says about its run. Totals are read from the root
// when it has them and counted from the test cases when it doesn't:
// hush-hush-php's root carries none, but its file holds 23 cases.

export interface JunitSummary {
  tests: number;
  failed: number;
  errors: number;
  skipped: number;
  seconds: number;
}

export function junitSummary(doc: Document): JunitSummary {
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("not valid XML");
  }
  const root = doc.documentElement;
  const cases = [...doc.getElementsByTagName("testcase")];
  const withChild = (tag: string) =>
    cases.filter((testCase) => testCase.getElementsByTagName(tag).length > 0).length;
  const fromRoot = (attribute: string, counted: () => number) =>
    root.hasAttribute(attribute) ? Number(root.getAttribute(attribute)) : counted();

  const rootTime = root.hasAttribute("time") ? Number(root.getAttribute("time")) : Number.NaN;
  const caseTime = cases.reduce(
    (sum, testCase) => sum + Number(testCase.getAttribute("time") ?? 0),
    0,
  );

  return {
    tests: fromRoot("tests", () => cases.length),
    failed: fromRoot("failures", () => withChild("failure")),
    errors: fromRoot("errors", () => withChild("error")),
    skipped: fromRoot("skipped", () => withChild("skipped")),
    seconds: Number.isFinite(rootTime) ? rootTime : caseTime,
  };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// "51 tests, 0 failed, 0 errors, 0 skipped": written out in full so no part of
// it depends on colour or on knowing the column.
export function describeSummary(summary: JunitSummary): string {
  return `${plural(summary.tests, "test")}, ${summary.failed} failed, ${summary.errors} errors, ${summary.skipped} skipped`;
}
