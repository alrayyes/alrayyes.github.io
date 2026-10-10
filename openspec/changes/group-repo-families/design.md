# Design

## Context

`directoryRows` in `src/lib/repoDirectory.ts` returns one flat A to Z row list with SDKs nested under their API, and `directoryGroups` splits that into letter groups with scaffolds at the end. `src/pages/index.astro` renders letter sections and a client script filters the `[data-repo-row]` elements. Group cards need logic that exists nowhere yet. See proposal.md for motivation and the spec for behaviour.

## Goals / Non-Goals

**Goals:**

- Derive families from repo names, with no new field in `repos.json`.
- Keep the grouping a pure function, tested like the rest of `repoDirectory.ts`.
- Keep the page working without JavaScript, as now.

**Non-Goals:**

- Hand-curated families or a per-repo group override.
- Changing the report pages or the catalogue schema.

## Decisions

- **Family by name prefix, derived.** The prefix is the name minus its last hyphen segment, and two or more non-API, non-SDK, non-scaffold repos sharing it make a family. Alternative: a `family` field in `repos.json`. Rejected because it is one more thing to keep true, and every current family follows the naming. A field can be added later for the exception.
- **Replace letter sections with group sections.** Order: API families, product families, scaffolds, then everything else, each A to Z inside. Alternative: keep letters and decorate the cards. Rejected because a card spanning one letter group reads as arbitrary.
- **One card component, three variants.** A `RepoGroupCard.astro` takes a type, a title and rows, and `RepoRow` is reused inside. The type label is text; colour is a second cue only.
- **Counts via data attributes.** Cards carry `data-group` and a member total, and the existing filter script sets the "N of M shown" text and hides empty cards, so the no-JavaScript render stays the full list.

## Risks / Trade-offs

- [A false family from a shared prefix, such as `forgejo-*`] → The rule needs the same prefix after dropping the last segment, which `forgejo-time-sync` and `forgejo-mirror-sync` don't meet. Check the real catalogue in the grouping test.
- [Losing the A to Z scan for repos in cards] → Cards sort by name, and the name filter stays.
- [Conflict with PR #203, which adds repos and edits `index.astro`] → Rebase after it merges and recheck families.

## Migration Plan

No data migration. Ship in one pull request and revert it if the page regresses.
