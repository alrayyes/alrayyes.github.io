# Tasks

## 1. Data

- [ ] 1.1 Write a failing check in `tests/repos-schema.spec.ts` that a repo's `group` must name a declared group and a group must have a member, then add `groups` and `group` to `repos.schema.json` and `repos.ts` until it passes
- [ ] 1.2 Declare the `washy-washy` product group and the `scaffolds` group in `repos.json` and set `group` on the seven repos, and verify the schema test passes

## 2. Grouping logic

- [ ] 2.1 Write failing tests in `src/lib/repoDirectory.test.ts` that rows carry their declared group, that a repo with no group falls under everything else, and that group order follows the file, then make `bun test` pass
- [ ] 2.2 Remove the scaffold special case from `directoryGroups` and verify no check of a repo's name or kind remains in the grouping code (`grep` the file)

## 3. Page

- [ ] 3.1 Add `RepoGroupCard.astro` with `product` and `scaffolds` variants and a text type label, and verify it renders in `bun run build`
- [ ] 3.2 Render the groups in `src/pages/index.astro` in place of letter sections, and verify the built `dist/index.html` shows the `washy-washy` card and the Scaffolds heading
- [ ] 3.3 Extend the filter script to hide empty cards and write "N of M shown", with a Playwright test in `tests/directory.spec.ts` covering partial and no match

## 4. Accessibility and docs

- [ ] 4.1 Add an axe-core scan of the page in light, dark and 375px to `tests/directory.spec.ts` and verify it passes with controls at least 36px tall
- [ ] 4.2 Update the page intro and `README.md` (including how to declare a group) so neither says the list is A to Z, and verify by reading both against the built page

## Workflow follow-up

- File the pull request with `Closes #204`, after PR #203 has merged.
- Archive this change once the pull request merges.
