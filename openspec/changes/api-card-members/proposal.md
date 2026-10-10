# Proposal

## Why

A group can only be a standalone card, so the hush-hush CLI and GitHub Action sit in a second card beside the Hush-Hush API card. Ticket #215 asks for one card with the API, its SDKs and those two repos.

## What Changes

- A group gets a third type, `api`. An API in `apis.json` names the group with an optional `group`, and so do the extra repos in `repos.json`.
- An `api` group renders as one card: the API row with its SDKs nested, then the other members under it.
- The stray `hush-hush` product group is removed, and `hush-hush-cli` and `hush-hush-action` join the API's group.
- The schema test also fails for a group of type `api` no API names.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `repo-directory-grouping`: an API card can take extra member repos, declared in the data.

## Impact

- `src/data/apis.json`, `apis.schema.json`, `apis.ts`, `repos.json`, `repos.schema.json`.
- `src/lib/repoGroups.ts` and `src/lib/repoDirectory.ts` with their tests, and `tests/directory.spec.ts`.
- The README's note on declaring groups.
