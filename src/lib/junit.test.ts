import { describe, expect, test } from "bun:test";
import { DOMParser } from "linkedom";
import { describeSummary, junitSummary } from "./junit";

const parse = (xml: string) =>
  new DOMParser().parseFromString(xml, "text/xml") as unknown as Document;

describe("junitSummary", () => {
  test("reads the totals and the time from the root when it has them", () => {
    const summary = junitSummary(
      parse(`<?xml version="1.0"?><testsuites tests="51" failures="2" errors="1" skipped="3" time="58.75312">
<testsuite name="e2e" tests="51"><testcase name="a" time="1"/></testsuite></testsuites>`),
    );
    expect(summary).toEqual({ tests: 51, failed: 2, errors: 1, skipped: 3, seconds: 58.75312 });
  });

  test("counts the cases when the root carries no totals", () => {
    const summary = junitSummary(
      parse(`<?xml version="1.0"?><testsuites><testsuite name="x">
<testcase name="ok" time="0.25"/>
<testcase name="bad" time="0.25"><failure message="boom"/></testcase>
<testcase name="worse" time="0.25"><failure message="boom"/></testcase>
<testcase name="broke" time="0.5"><error message="crash"/></testcase>
<testcase name="later" time="0.5"><skipped/></testcase></testsuite></testsuites>`),
    );
    expect(summary).toEqual({ tests: 5, failed: 2, errors: 1, skipped: 1, seconds: 1.75 });
  });

  test("counts a case once however many failure children it has", () => {
    const summary = junitSummary(
      parse(
        `<testsuites><testsuite><testcase name="a"><failure/><failure/></testcase></testsuite></testsuites>`,
      ),
    );
    expect(summary.failed).toBe(1);
  });

  test("takes each total from the root separately, counting only the ones it lacks", () => {
    const summary = junitSummary(
      parse(
        `<testsuites tests="10" failures="0"><testsuite><testcase name="a"><error/></testcase><testcase name="b"><skipped/></testcase></testsuite></testsuites>`,
      ),
    );
    expect(summary).toMatchObject({ tests: 10, failed: 0, errors: 1, skipped: 1 });
  });

  test("sums the case times when the root has no time, and treats a missing case time as zero", () => {
    const summary = junitSummary(
      parse(
        `<testsuites><testsuite><testcase name="a" time="2"/><testcase name="b"/></testsuite></testsuites>`,
      ),
    );
    expect(summary.seconds).toBe(2);
  });

  test("prefers the root's time even when it is zero", () => {
    const summary = junitSummary(
      parse(
        `<testsuites time="0"><testsuite><testcase name="a" time="5"/></testsuite></testsuites>`,
      ),
    );
    expect(summary.seconds).toBe(0);
  });

  test("falls back to the case times when the root's time isn't a number", () => {
    const summary = junitSummary(
      parse(
        `<testsuites time="abc"><testsuite><testcase name="a" time="2"/><testcase name="b" time="0.5"/></testsuite></testsuites>`,
      ),
    );
    expect(summary.seconds).toBe(2.5);
  });

  test("reads a single testsuite root the same way", () => {
    const summary = junitSummary(
      parse(`<testsuite tests="3" failures="1" errors="0" skipped="0" time="1.5"/>`),
    );
    expect(summary).toEqual({ tests: 3, failed: 1, errors: 0, skipped: 0, seconds: 1.5 });
  });

  test("throws when the parser reports an error", () => {
    expect(() => junitSummary(parse(`<parsererror>not well-formed</parsererror>`))).toThrow(
      "not valid XML",
    );
  });
});

describe("describeSummary", () => {
  test("writes every figure out in full", () => {
    expect(describeSummary({ tests: 51, failed: 0, errors: 0, skipped: 0, seconds: 1 })).toBe(
      "51 tests, 0 failed, 0 errors, 0 skipped",
    );
  });

  test("says 0 tests, plural", () => {
    expect(describeSummary({ tests: 0, failed: 0, errors: 0, skipped: 0, seconds: 0 })).toBe(
      "0 tests, 0 failed, 0 errors, 0 skipped",
    );
  });

  test("says 1 test, not 1 tests", () => {
    expect(describeSummary({ tests: 1, failed: 1, errors: 2, skipped: 3, seconds: 1 })).toBe(
      "1 test, 1 failed, 2 errors, 3 skipped",
    );
  });
});
