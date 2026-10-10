# Design

## Context

`directoryRows` in `src/lib/repoDirectory.ts` returns one flat A to Z row list with SDKs nested under their API, and `directoryGroups` splits that into letter groups with scaffolds at the end. `src/pages/index.astro` renders letter sections and a client script filters the `[data-repo-row]` elements. `repos.json` has no notion of a group yet. See proposal.md for motivation and the spec for behaviour.

## Goals / Non-Goals

**Goals:**

- Let `repos.json` dictate every grouping, so the template and `repoDirectory.ts` carry no naming rules.
- Keep the grouping a pure function over the data, tested like the rest of `repoDirectory.ts`.
- Keep the page working without JavaScript, as now.

**Non-Goals:**

- Guessing groups from names.
- Changing the report pages.

## Decisions

- **Declared groups, referenced by id.** `repos.json` gains a top-level `groups` array of `{ id, title, type, description? }`, with `type` one of `product` or `scaffolds`, and each repo gets an optional `group` holding an id. Alternatives: derive families from the name prefix, rejected because it puts a naming rule in code, and a free-text `group` on each repo, rejected because a typo then makes a silent one-repo group and the scaffolds have nowhere to keep a description. Ids make a typo a schema failure.
- **The schema enforces the references.** `repos.schema.json` types the new fields, and `tests/repos-schema.spec.ts` gains a check that every `group` names a declared id and every group has a member. JSON Schema can't express the cross-reference on its own.
- **API families stay data-driven already.** `apis.json` nests SDKs under their API, so that card needs no new field.
- **Replace letter sections with group sections.** Order is the order of `groups` in the file: API cards, then declared groups, then everything else (repos with no `group`), A to Z inside each. Alternative: keep letters and decorate the cards. Rejected because a card spanning one letter group reads as arbitrary.
- **One card component, variants by `type`.** `RepoGroupCard.astro` takes a group and its rows, and `RepoRow` is reused inside. The type label is text, colour a second cue.
- **Counts via data attributes.** Cards carry the member total and the existing filter script writes "N of M shown" and hides empty cards, so the no-JavaScript render stays the full list.

## Risks / Trade-offs

- [A hand-kept `group` drifts from reality when a repo is added] → The schema test rejects an undeclared id and an empty group; a new repo with no `group` lands under everything else, which is safe.
- [Losing the A to Z scan for repos in cards] → Rows sort by name inside a card, and the name filter stays.
- [Conflict with PR #203, which adds repos and edits `index.astro`] → Rebase after it merges and recheck families.

## Migration Plan

Add the `groups` array and each repo's `group` in the same pull request as the rendering, so no commit has fields nothing reads. Revert the pull request if the page regresses.
