#!/usr/bin/env bash
# Reads changed file paths on stdin, one per line, and prints one
# `group=true|false` line per CI job group, ready for $GITHUB_OUTPUT.
#
# A group lists what its jobs actually open, not what they're named for:
# the test job builds the site, which renders CHANGELOG.md and LICENSE, so
# those two count as site files. Editing ci.yml turns every group on, so a
# pipeline change always runs the pipeline. scripts/changed-groups.test.ts
# holds one case per path.
set -euo pipefail

site=false deps=false security=false prose=false

while IFS= read -r file; do
  case "$file" in
    .github/workflows/ci.yml)
      site=true deps=true security=true prose=true
      continue
      ;;
  esac

  # lint, test and the build. The filter's own script and test count: the
  # test job is what runs that test.
  case "$file" in
    scripts/changed-groups.* | src/* | public/* | tests/* | astro.config.mjs | tsconfig.json | package.json | bun.lock | \
      biome.json | .oxlintrc.json | playwright.config.ts | CHANGELOG.md | LICENSE)
      site=true
      ;;
  esac

  # bun audit reads the lockfile.
  case "$file" in
    package.json | bun.lock) deps=true ;;
  esac

  # semgrep scans the whole checkout; the site, the scripts and the pipeline
  # are the code in it.
  case "$file" in
    src/* | public/* | tests/* | scripts/* | .github/* | astro.config.mjs | playwright.config.ts)
      security=true
      ;;
  esac

  # prettier (md, yml, yaml, astro) and markdownlint.
  case "$file" in
    *.md | *.yml | *.yaml | *.astro | .prettierrc.json | .prettierignore)
      prose=true
      ;;
  esac
done

printf 'site=%s\ndeps=%s\nsecurity=%s\nprose=%s\n' "$site" "$deps" "$security" "$prose"
