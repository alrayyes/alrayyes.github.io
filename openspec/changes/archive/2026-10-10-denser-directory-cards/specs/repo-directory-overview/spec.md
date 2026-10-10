# Spec Delta

## Purpose

Defines the summary and shortcuts at the top of the Repositories page, so a visitor sees the size of the directory and can reach the filter quickly.

## ADDED Requirements

### Requirement: Stats strip

The page SHALL show a strip with the repo count, the API and SDK counts and the number of repos with a CI badge, each derived from the data and nothing else.

#### Scenario: Counts match the data

- **WHEN** the page renders
- **THEN** each figure equals the count derived from the catalogue, and no coverage average or refresh time is shown

### Requirement: Filter shortcut

Pressing `/` while focus is not in a text field SHALL focus the name filter without typing the key into it.

#### Scenario: Outside a field

- **WHEN** focus is on the page body and the visitor presses `/`
- **THEN** the name filter takes focus and stays empty

#### Scenario: Inside a field

- **WHEN** focus is in a text field and the visitor presses `/`
- **THEN** the character is typed

### Requirement: Reset control

The control that clears every filter SHALL read "Reset".

#### Scenario: Filters set

- **WHEN** any filter is set
- **THEN** a control reading "Reset" is shown and clears them all
