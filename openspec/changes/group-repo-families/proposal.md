# Proposal

## Why

An API and its SDKs read as one family on the Repositories page, nested under a shared border. Repos with no SDKs get nothing comparable. `washy-washy-cli`, `-web` and `-pdf` sit as unrelated rows in the A to Z list, and the scaffolds are a plain trailing block. Ticket #204 asks for those groups to be as obvious as the API family. The design is `docs/design/stitch-repo-directory-family-grouping.png`.

## What Changes

- Repos that share a name prefix and have no SDKs render together as one family card: header with the family name, a type label and a repo count, members as rows inside.
- The scaffolds get their own headed section with a one-line description and a visibly different treatment.
- An API with SDKs keeps its nested layout, restyled as the same kind of card so the three group types look related.
- Each group type is told apart by a text label as well as colour.
- Filtering updates the cards: a card with no matching member hides, and a partly matching one shows "N of M shown".
- Repos in no family stay as ordinary rows under a quieter section.

## Capabilities

### New Capabilities

- `repo-directory-grouping`: how the Repositories page groups repos into API families, product families, scaffolds and everything else, and how filtering interacts with those groups.

### Modified Capabilities

None. `openspec/specs/` is empty, so the existing A to Z listing has no spec to amend.

## Impact

- `src/lib/repoDirectory.ts` (grouping logic and its tests), `src/pages/index.astro`, `src/components/RepoRow.astro` and a new card component.
- `tests/directory.spec.ts`: a Playwright journey with an axe scan in light, dark and 375px.
- README and the page intro, which still describe an A to Z list.
- Touches the same files as PR #203 (list every active repo), which adds repos. This change should land after it, so families form over the full set.
