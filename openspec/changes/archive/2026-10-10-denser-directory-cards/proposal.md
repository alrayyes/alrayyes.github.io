# Proposal

## Why

Each group card is full width and stacks under the last, so the grouped page is long. A Stitch audit redrew it denser. Ticket #221 adopts the parts that rest on real data: a two-column grid for product cards, a compact Scaffolds grid, a stats strip, a `/` shortcut for the filter, and a "Reset" label. It rejects the audit's invented numbers.

## What Changes

- Product cards sit two to a row from 1024px and stack below it.
- The Scaffolds section lays its repos out in a grid of three columns from 1024px.
- A stats strip above the filter shows the repo count, the API and SDK counts, and how many repos have a CI badge, all derived from the data.
- Pressing `/` outside a text field focuses the name filter.
- The control that clears the filters reads "Reset".

## Capabilities

### New Capabilities

- `repo-directory-overview`: the stats strip, the filter shortcut and the reset control at the top of the Repositories page.

### Modified Capabilities

- `repo-directory-grouping`: product cards and the Scaffolds section get denser layouts.

## Impact

- `src/pages/index.astro`, `src/components/RepoGroupCard.astro`, `src/components/RepoRow.astro`.
- `src/lib/repoDirectory.ts` (the stats) with its tests, and `tests/directory.spec.ts`.
- README, where it describes the page.
