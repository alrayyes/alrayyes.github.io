# Proposal

## Why

An API and its SDKs read as one family on the Repositories page, nested under a shared border. Repos with no SDKs get nothing comparable. `washy-washy-cli`, `-web` and `-pdf` sit as unrelated rows in the A to Z list, and the scaffolds are a plain trailing block. Ticket #204 asks for those groups to be as obvious as the API family. The design is `docs/design/stitch-repo-directory-family-grouping.png`.

## What Changes

- `repos.json` declares the groups (an id, a title, a type and an optional description) and each repo names the group it belongs to. The data decides the grouping and the template applies no rules of its own.
- A group of type `product` renders as a family card: header with the title, a type label and a repo count, members as rows inside.
- A group of type `scaffolds` renders as its own headed section with its description and a visibly different treatment.
- An API with SDKs keeps its nested layout, restyled as the same kind of card so the three group types look related.
- Each group type is told apart by a text label as well as colour.
- Filtering updates the cards: a card with no matching member hides, and a partly matching one shows "N of M shown".
- Repos that name no group stay as ordinary rows under a quieter section.

## Capabilities

### New Capabilities

- `repo-directory-grouping`: how the catalogue declares groups and how the Repositories page renders them as API families, product families, scaffolds and everything else, and how filtering interacts with those groups.

### Modified Capabilities

None. `openspec/specs/` is empty, so the existing A to Z listing has no spec to amend.

## Impact

- `src/data/repos.json`, `repos.schema.json` and `repos.ts` (the groups and each repo's `group`), `src/lib/repoDirectory.ts` (reads them, and its tests), `src/pages/index.astro`, `src/components/RepoRow.astro` and a new card component.
- `tests/directory.spec.ts`: a Playwright journey with an axe scan in light, dark and 375px.
- README and the page intro, which still describe an A to Z list.
- Touches the same files as PR #203 (list every active repo), which adds repos. This change should land after it, so families form over the full set.
