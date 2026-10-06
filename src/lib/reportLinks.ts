// The reports a repo publishes to its Pages site, as the catalogue lists them
// (see apis.schema.json). Fixed order, so every card reads the same.
export interface Reports {
  lighthouse?: string;
  tests?: string;
  coverage?: string;
  coverageXml?: string;
}

export interface ReportLink {
  label: string;
  href: string;
}

const LABELS: ReadonlyArray<readonly [keyof Reports, string]> = [
  ["lighthouse", "Lighthouse"],
  ["tests", "Test results"],
  ["coverage", "Coverage"],
  ["coverageXml", "coverage.xml"],
];

export function reportLinks(reports: Reports | undefined): ReportLink[] {
  if (!reports) return [];
  return LABELS.flatMap(([key, label]) => {
    const href = reports[key];
    return href ? [{ label, href }] : [];
  });
}
