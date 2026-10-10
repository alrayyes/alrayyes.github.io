# Spec Delta

## ADDED Requirements

### Requirement: API cards take extra repos

A group of type `api` SHALL render as one card holding the API that names it, with its SDKs nested, and every repo that names the same group listed under the API.

#### Scenario: CLI and action join the API

- **WHEN** `hush-hush`, `hush-hush-cli` and `hush-hush-action` all name the group `hush-hush`
- **THEN** one card holds the API, its four SDKs, the CLI and the action, with a "7 repos" count and the "API and SDKs" label

#### Scenario: A group of type `api` that nobody names

- **WHEN** a group of type `api` is declared and no API names it
- **THEN** the schema check fails and says which group

### Requirement: APIs without a group keep their own card

An API with SDKs that names no group SHALL render as its own card, as before.

#### Scenario: Plain API

- **WHEN** an API names no group
- **THEN** it is one "API and SDKs" card with its SDKs nested and nothing else in it
