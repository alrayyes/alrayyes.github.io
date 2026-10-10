# Design

## Context

`repoReports.ts` renders one chip per score from `LighthouseRun.scores`, whole numbers from 0 to 100, and picks a colour with `scoreBand`. See the proposal.

## Goals / Non-Goals

**Goals:**

- Every figure derived from the manifest's scores.
- Colour never the only carrier of meaning.

**Non-Goals:**

- The audit's runner line, "Audit Passed" badge, page nicknames, timings, engine version, empty-state preview and score-scale panel, none of which the data holds.

## Decisions

- **Pure functions for the numbers.** `bandLabel(score)` returns Good, Needs improvement or Poor from `scoreBand`, and `siteAverage(rows)` returns the rounded mean of each category over the representative runs. Both are unit tested; the script only renders.
- **Ring as an SVG with the number as text.** The ring is decoration (`aria-hidden`); the tile's text reads `83%`, the category and the band word, so a screen reader and a printout get the same facts.
- **Average over representative runs only.** The other runs of a page are retries, so counting them would weight a page by how often it ran.
- **Keep the `data-score` and `data-band` attributes** on the tiles so existing tests and styling hooks still find them.

## Risks / Trade-offs

- A category missing from one run is left out of that category's mean rather than counted as zero.
