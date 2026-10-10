# Proposal

## Why

A repo's Lighthouse page shows each audited page's scores as chips such as `Performance 83`: no percent sign, no band word and no overall view. A Stitch redraw (ticket #239) puts four score tiles in each row and a site average above them. It rests on data the manifest already holds, so this change adopts it and drops the audit's invented content.

## What Changes

- Each Lighthouse row shows Performance, Accessibility, Best practices and SEO as percentages, each with its band word.
- A "Site average" set of the same four tiles sits above the rows, the rounded mean over each page's representative run.
- A directory with no manifest has no scores, so it gets neither tiles nor an average.

## Capabilities

### New Capabilities

- `lighthouse-report-page`: how a repo's Lighthouse page shows scores.

### Modified Capabilities

None.

## Impact

- `src/lib/reportDirectory.ts` (the average and band labels) with its tests.
- `src/scripts/repoReports.ts`, which renders the rows.
- `tests/repo-reports.spec.ts` and the README's description of the report page.
