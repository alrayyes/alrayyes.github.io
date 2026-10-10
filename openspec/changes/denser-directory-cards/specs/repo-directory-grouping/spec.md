# Spec Delta

## ADDED Requirements

### Requirement: Product cards sit two to a row

The page SHALL lay product cards out two to a row from 1024px wide and in one column below that, with no sideways scroll.

#### Scenario: Wide viewport

- **WHEN** the viewport is at least 1024px wide
- **THEN** two product cards share one row

#### Scenario: Phone

- **WHEN** the viewport is 375px wide
- **THEN** product cards stack in one column and the page does not scroll sideways

### Requirement: Scaffolds grid

The page SHALL lay the Scaffolds section's repos out in at least three columns from 1024px wide, each cell showing the repo's name and report links at least 36px tall.

#### Scenario: Wide viewport

- **WHEN** the viewport is at least 1024px wide
- **THEN** at least three scaffolds share one row
