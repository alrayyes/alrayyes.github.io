# Tasks

## 1. Stats

- [ ] 1.1 Write failing tests in `src/lib/repoDirectory.test.ts` for `directoryStats` (repo count, APIs, SDKs, repos with a CI badge), then make `bun test` pass
- [ ] 1.2 Render the strip in `src/pages/index.astro` and verify a Playwright test checks each figure against the catalogue data

## 2. Layout

- [ ] 2.1 Wrap runs of product cards in a two-column grid from 1024px, and verify Playwright checks two to a row at 1280px and one column with no sideways scroll at 375px
- [ ] 2.2 Add the `compact` row and the Scaffolds grid, and verify Playwright checks three or more to a row at 1280px with cells at least 36px tall

## 3. Filter controls

- [ ] 3.1 Add the `/` shortcut with Playwright tests for outside a field, inside a field and with a modifier key
- [ ] 3.2 Rename the clear controls to "Reset", update the tests that name them, and verify the e2e run passes with its axe scans in light, dark and 375px
- [ ] 3.3 Update the README where it describes the page and verify it matches

## Workflow follow-up

- File the pull request with `Closes #221`.
- Archive this change once the pull request merges.
