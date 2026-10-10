# Design

## Context

`directorySections` puts a card per API with SDKs first, then each declared group, then the rest. A repo joins a group through `group` in `repos.json`; APIs have no such field. See the proposal and the archived `group-repo-families` design.

## Goals / Non-Goals

**Goals:**

- Keep the data in charge: the API and its extra repos share a group id.
- Change nothing for an API that names no group.

**Non-Goals:**

- Letting an SDK or a repo join more than one group.

## Decisions

- **`group` on the API entry, `type: "api"` on the group.** The API and its extras share an id, so no code matches on names. Alternative: a repo's `group` naming the API directly, rejected because APIs are keyed by repo URL and name in two spellings, which puts a matching rule in code.
- **Cross-check covers APIs.** `groupProblems` takes the API entries too, so a group of type `api` with no API, a plain group naming an API, or a repo naming an undeclared id fails.
- **Card order.** The API row, which carries its SDKs, comes first inside the card, then the extra repos A to Z. Each `api` group takes the place of that API's own card, so the API cards stay A to Z with the other API cards.

## Risks / Trade-offs

- [Extras read as siblings of the API, not as part of it] → The card header and count say they belong together; a nested look for extras can follow if it matters.
