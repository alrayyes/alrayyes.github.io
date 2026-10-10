# lighthouse-report-page Specification

## Purpose

Defines how a repo's Lighthouse page shows the scores it reads from the repo's manifest.

## Requirements

### Requirement: Rows show the four scores as percentages

Each audited page's row SHALL show Performance, Accessibility, Best practices and SEO as whole percentages, each with its category name and a band word of Good (90 to 100), Needs improvement (50 to 89) or Poor (0 to 49).

#### Scenario: A scored page

- **WHEN** a page's representative run scored Performance 83
- **THEN** its row shows `83%`, "Performance" and "Needs improvement"

#### Scenario: Colour is not the only signal

- **WHEN** a score is shown in a band colour
- **THEN** the same band is also stated as text

### Requirement: Site average

The page SHALL show a "Site average" above the rows: for each category, the rounded mean of the pages' representative runs.

#### Scenario: Mean of the representative runs

- **WHEN** two pages' representative runs score Performance 96 and 91, and a third run of the first page scored 40
- **THEN** the site average Performance is 94%

### Requirement: No scores, no tiles

A repo whose directory has no manifest SHALL show no score tiles and no site average, and its report links SHALL stay.

#### Scenario: Directory without a manifest

- **WHEN** the directory lists reports but no `manifest.json`
- **THEN** each row shows only its HTML and JSON links and no average appears

### Requirement: Fits a phone

At 360px wide the tiles SHALL wrap and the page SHALL NOT scroll sideways.

#### Scenario: Phone

- **WHEN** the viewport is 360px wide
- **THEN** the page has no horizontal scroll
