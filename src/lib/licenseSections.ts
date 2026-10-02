// Splits GPL-3.0's plain-text LICENSE into anchored sections for the license
// page's table of contents. The text itself is never altered: every line of
// the file ends up in exactly one section's body, bar the heading lines
// ("  15. Disclaimer of Warranty."), which become the section's title.
export interface LicenseSection {
  id: string;
  title: string;
  body: string;
}

const NUMBERED = /^ {2}(\d+)\. (.+)\.$/;
const HOW_TO_APPLY = /^\s+How to Apply These Terms to Your New Programs\s*$/;

export function licenseSections(text: string): LicenseSection[] {
  const sections: LicenseSection[] = [{ id: "preamble", title: "Preamble", body: "" }];
  const lines = text.split("\n");

  for (const [index, line] of lines.entries()) {
    const numbered = NUMBERED.exec(line);
    if (numbered) {
      sections.push({
        id: `section-${numbered[1]}`,
        title: `${numbered[1]}. ${numbered[2]}`,
        body: "",
      });
    } else if (HOW_TO_APPLY.test(line)) {
      sections.push({ id: "how-to-apply", title: "How to Apply These Terms", body: "" });
    } else {
      const current = sections[sections.length - 1] as LicenseSection;
      current.body += index === lines.length - 1 && line === "" ? "" : `${line}\n`;
    }
  }

  return sections.map((section) => ({ ...section, body: section.body.replace(/^\n+|\n+$/g, "") }));
}
