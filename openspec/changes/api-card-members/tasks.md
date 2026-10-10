# Tasks

## 1. Data and checks

- [x] 1.1 Write failing tests in `src/lib/repoGroups.test.ts` for an `api` group nobody names and a non-`api` group an API names, then extend `groupProblems` to take the API entries and verify they pass
- [x] 1.2 Add `group` to the API shape in `apis.schema.json` and `apis.ts`, and the `api` type to `repos.schema.json` and `repoGroups.ts`, and verify `tests/repos-schema.spec.ts` and `tests/catalogue-schema.spec.ts` pass
- [x] 1.3 Set `group: "hush-hush"` on the API, the CLI and the action, change the group's type to `api` and drop its description, and verify the schema test passes

## 2. Page

- [x] 2.1 Write a failing test in `src/lib/repoDirectory.test.ts` that an `api` group is one section with the API first and the extras after, and that an API with no group keeps its own, then make `bun test` pass
- [x] 2.2 Update `tests/directory.spec.ts`: one hush-hush card with seven repos, no second one, and "2 of 7 shown" under a filter, and verify the e2e run passes with its axe scans
- [x] 2.3 Update the README's note on declaring groups and verify it matches the page

## Workflow follow-up

- File the pull request with `Closes #215`, after #216 (the archive) has merged.
- Archive this change once the pull request merges.
