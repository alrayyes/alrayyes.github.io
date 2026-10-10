# Design

## Context

`index.astro` renders each `directorySections` entry as a `RepoGroupCard` in one stacked list, and `RepoRow` is a flex row that stacks below `sm`. See the proposal and the `repo-directory-grouping` spec.

## Goals / Non-Goals

**Goals:**

- Denser layout with no change to the data or the section order.
- Every figure on the page derived from the data.

**Non-Goals:**

- Coverage averages, freshness times, a "Utilities" category or registry links, which the data doesn't hold.

## Decisions

- **Grid by wrapping runs of product cards.** The page wraps each run of adjacent product sections in a `lg:grid-cols-2` container, so API cards and Scaffolds stay full width. Filtering hides cards and the grid reflows.
- **A `compact` row for the Scaffolds grid.** `RepoRow` takes a `compact` flag that stacks its name, badges and links, so a narrow cell doesn't squeeze them side by side.
- **Stats from a pure function.** `directoryStats(rows)` returns the counts, tested like the rest of `repoDirectory.ts`, and the page only renders them.
- **Shortcut in the existing filter script.** One `keydown` listener ignores events from inputs, selects and textareas, and from modified keys.

## Risks / Trade-offs

- [A card grows tall next to a short one in the same row] → The grid stretches cards to equal height, which is acceptable.
