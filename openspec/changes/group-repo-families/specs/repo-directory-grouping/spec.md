# Spec Delta

## Purpose

Defines how the catalogue declares repo groups and how the Repositories page renders them, so that related repos and template repos read as deliberate groups and the grouping lives in data.

## ADDED Requirements

### Requirement: Groups are declared in the data file

The catalogue SHALL declare groups in `repos.json`, each with an id, a title and a type, and a repo SHALL join a group by naming its id. The page SHALL group only by that declaration.

#### Scenario: Repos name a group

- **WHEN** `washy-washy-cli`, `washy-washy-web` and `washy-washy-pdf` each name the group `washy-washy`
- **THEN** they appear together in one card titled `washy-washy` with a "3 repos" count, and no other repo is in it

#### Scenario: Similar names, no declaration

- **WHEN** two repos share a name prefix but name no group
- **THEN** they appear as ordinary rows and not in a card

#### Scenario: Unknown group id

- **WHEN** a repo names a group id that is not declared
- **THEN** the schema check fails and the build does not ship the page

### Requirement: Product groups

The page SHALL render a group of type `product` as a card with its title, a "Product" text label and a repo count, with its members as rows inside.

#### Scenario: Product card

- **WHEN** a `product` group has three members
- **THEN** one card renders with the title, the "Product" label and "3 repos"

### Requirement: Scaffolds group

The page SHALL render a group of type `scaffolds` under its title as a heading with its description, styled differently from API and product cards.

#### Scenario: Scaffolds present

- **WHEN** the four `scaffold-*` repos name the `scaffolds` group
- **THEN** they appear under that group's heading and description, and none is in a product card

### Requirement: API families keep their SDKs

The page SHALL render an API with SDKs as a card in the same structure as the other group cards, with each SDK nested under the API.

#### Scenario: API with an SDK

- **WHEN** an API has an SDK in the catalogue
- **THEN** the SDK is nested under the API inside one card whose header has the same parts as a product card

### Requirement: Group type is not colour only

Each group card SHALL name its type in text, and every control in it SHALL be at least 36px tall.

#### Scenario: Type label

- **WHEN** a group card renders in light, dark or at 375px wide
- **THEN** its header reads "API and SDKs", "Product" or "Scaffolds" in text, and an axe-core scan finds no violations

### Requirement: Filtering updates groups

The page SHALL hide a group card with no visible members and SHALL show "N of M shown" in the header of a partly visible one.

#### Scenario: Partial match

- **WHEN** a filter leaves two of the three `washy-washy` repos visible
- **THEN** the card header reads "2 of 3 shown"

#### Scenario: No match

- **WHEN** a filter hides every member of a card
- **THEN** the card is not shown
