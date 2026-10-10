# Tasks

## 1. Grouping logic

- [ ] 1.1 Write failing tests in `src/lib/repoDirectory.test.ts` for family detection (three `washy-washy-*` form a family, a lone repo does not, scaffolds and APIs are excluded), then make `bun test` pass
- [ ] 1.2 Add the group ordering (API families, product families, scaffolds, everything else, A to Z inside) and verify the test for it passes
- [ ] 1.3 Add a test that runs the real catalogue through the grouping and asserts the families are exactly the expected ones, so a false family fails CI

## 2. Page

- [ ] 2.1 Add `RepoGroupCard.astro` with the three variants and a text type label, and verify it renders in `bun run build`
- [ ] 2.2 Render the groups in `src/pages/index.astro` in place of letter sections, and verify the built `dist/index.html` shows the `washy-washy` card and the Scaffolds heading
- [ ] 2.3 Extend the filter script to hide empty cards and write "N of M shown", with a Playwright test in `tests/directory.spec.ts` covering partial and no match

## 3. Accessibility and docs

- [ ] 3.1 Add an axe-core scan of the page in light, dark and 375px to `tests/directory.spec.ts` and verify it passes with controls at least 36px tall
- [ ] 3.2 Update the page intro and `README.md` so neither says the list is A to Z, and verify by reading both against the built page

## Workflow follow-up

- File the pull request with `Closes #204`, after PR #203 has merged.
- Archive this change once the pull request merges.
