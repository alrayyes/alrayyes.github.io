import { describe, expect, test } from "bun:test";
import { licenseSections } from "./licenseSections";

describe("licenseSections", () => {
  test("puts text before the first numbered heading in the preamble", () => {
    const sections = licenseSections("GNU GENERAL PUBLIC LICENSE\n\nTerms.\n");

    expect(sections).toEqual([
      { id: "preamble", title: "Preamble", body: "GNU GENERAL PUBLIC LICENSE\n\nTerms." },
    ]);
  });

  test("starts a section at each numbered heading and drops the heading line from the body", () => {
    const text = ["Intro", "  0. Definitions.", "Some terms.", "  1. Source Code.", "More."].join(
      "\n",
    );

    expect(licenseSections(text)).toEqual([
      { id: "preamble", title: "Preamble", body: "Intro" },
      { id: "section-0", title: "0. Definitions", body: "Some terms." },
      { id: "section-1", title: "1. Source Code", body: "More." },
    ]);
  });

  test("handles multi-digit section numbers", () => {
    const [, section] = licenseSections("  15. Disclaimer of Warranty.\nNo warranty.");

    expect(section).toEqual({
      id: "section-15",
      title: "15. Disclaimer of Warranty",
      body: "No warranty.",
    });
  });

  test("ignores numbered-looking lines that aren't headings", () => {
    const text = [
      "  1. Source Code",
      "   2. Indented too far.",
      "  3. Missing the final full stop",
    ].join("\n");

    expect(licenseSections(text)).toEqual([{ id: "preamble", title: "Preamble", body: text }]);
  });

  test("starts the how-to-apply section at its centred heading", () => {
    const text = [
      "  17. Interpretation.",
      "Done.",
      "",
      "      How to Apply These Terms to Your New Programs",
      "",
      "Do this.",
    ].join("\n");

    expect(licenseSections(text)).toEqual([
      { id: "preamble", title: "Preamble", body: "" },
      { id: "section-17", title: "17. Interpretation", body: "Done." },
      { id: "how-to-apply", title: "How to Apply These Terms", body: "Do this." },
    ]);
  });

  test("trims blank lines around a body but keeps blank lines inside it", () => {
    const [, section] = licenseSections("  1. Title.\n\n\nfirst\n\nsecond\n\n\n");

    expect(section?.body).toBe("first\n\nsecond");
  });

  test("keeps every non-heading line, in order, across the sections", () => {
    const text = "a\n  1. One.\nb\nc\n  2. Two.\nd\n";
    const bodies = licenseSections(text).map((section) => section.body);

    expect(bodies.join("\n")).toBe("a\nb\nc\nd");
  });

  test("returns only an empty preamble for empty input", () => {
    expect(licenseSections("")).toEqual([{ id: "preamble", title: "Preamble", body: "" }]);
  });
});
