# Spec Delta

## Purpose

Defines how the Repositories page groups repos so that related repos, and template repos, read as deliberate groups and not as a flat list.

## ADDED Requirements

### Requirement: Product families

The page SHALL render repos that have no SDKs and share a name prefix as one card headed by that prefix, with a repo count. A family needs at least two members.

#### Scenario: Three repos share a prefix

- **WHEN** the catalogue holds `washy-washy-cli`, `washy-washy-web` and `washy-washy-pdf`
- **THEN** they appear together in one card headed `washy-washy` with a "3 repos" count, and no other repo is in that card

#### Scenario: A repo has no sibling

- **WHEN** a repo shares its prefix with no other repo
- **THEN** it is not in a family card and appears under the ungrouped section

### Requirement: Scaffolds section

The page SHALL list the scaffold repos under their own "Scaffolds" heading with a one-line description, styled differently from API and product cards.

#### Scenario: Scaffolds present

- **WHEN** the catalogue holds the four `scaffold-*` repos
- **THEN** they appear under a "Scaffolds" heading with a description, and none of them is in a product family card

### Requirement: API families keep their SDKs

The page SHALL render an API with SDKs as a card in the same structure as the other group cards, with each SDK nested under the API.

#### Scenario: API with an SDK

- **WHEN** an API row has an SDK in the catalogue
- **THEN** the SDK is nested under the API inside one card whose header has the same parts as a product family card

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
