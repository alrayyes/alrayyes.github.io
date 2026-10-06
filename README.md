# alrayyes.github.io

[![CI](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/alrayyes/alrayyes.github.io/graph/badge.svg)](https://codecov.io/gh/alrayyes/alrayyes.github.io)
[![release](https://img.shields.io/github/v/release/alrayyes/alrayyes.github.io?sort=semver)](https://github.com/alrayyes/alrayyes.github.io/releases/latest)
[![licence](https://img.shields.io/badge/licence-GPL--3.0--or--later-blue.svg)](LICENSE)

A catalogue of the public HTTP APIs I maintain, deployed at
[apis.ryankes.eu](https://apis.ryankes.eu). For each API it links the
service's own GitHub repo, its OpenAPI spec, and every generated SDK
(repo and, where one is published, its API-reference docs site).

The catalogue itself is `src/data/apis.json`, validated by
`src/data/apis.schema.json`. Adding a new API or SDK is a
plain data-file edit, not a template change.

An API or SDK entry can also carry `reports`: links to the Lighthouse,
test-result and coverage reports (`lighthouse`, `tests`, `coverage`,
`coverageXml`) that its repo publishes at
`apis.ryankes.eu/<repo>/reports/` (this repo, being the user site, has no
prefix: see Reports below). The card shows a link for each key
present. Add a key only once its URL returns 200.

## Requirements

- **[bun](https://bun.sh) 1.3 or newer.** It's the package manager, the
  runner for every script below, and the [lefthook](https://lefthook.dev)
  that runs the git hooks.

## Everyday commands

Every one of these is what a hook or CI runs — see `lefthook.yml` and
`.github/workflows/*.yml` for exactly which.

```sh
bun run dev
bun run build
bun run check                 # astro check, type-checks .astro and .ts together
bun run test                  # unit, then playwright
bun run test:unit             # bun test, for src/lib
bun run test:coverage         # the same, writing coverage/lcov.info for Codecov
bun run test:e2e              # playwright, against the built site

bun run lint                  # biome check ., the check-only form
bun run format                # biome check --write ., the fixer

bun run format:check          # prettier --check (md/yml/astro), add --write to fix
bun run lint:md
bun run lint:prose            # vale
bun run lint:mechanics        # ltex-cli-plus
bun run lint:tailwind         # oxlint, shadcn/lint's Tailwind rules
```

## Deployment

The `build` and `deploy` jobs in `.github/workflows/ci.yml` build the site
and deploy it to GitHub Pages on every push to `main`, served at the custom
domain `apis.ryankes.eu` (`public/CNAME`, with a DNS `CNAME` record pointed
at `alrayyes.github.io`). They need the `lint`, `audit`, `security`, `test`
and `prose` jobs, so a red run on `main` deploys nothing. The Actions tab's
"Run workflow" button redeploys by hand, through the same gates. The
reason for GitHub Pages over Cloudflare is in
[the deployment decision record](docs/adr/0001-deploy-to-github-pages.md).

## Reports

Every deploy also publishes this repo's own test and coverage reports, at
[apis.ryankes.eu/reports](https://apis.ryankes.eu/reports/):

- `tests/`: the JUnit XML of the unit and end-to-end runs, and Playwright's
  HTML report.
- `coverage/`: an HTML view, `coverage.xml` (Cobertura) and
  `lcov.info`.
- `lighthouse/`: an HTML and a JSON Lighthouse report for each page,
  from `scripts/lighthouse.sh` (`bun run lighthouse` runs it locally).

The `test` job writes them and `scripts/assemble-reports.ts` lays them out; the
`build` job adds the result to the site. The job installs `lcov` (for
`genhtml`) and `lcov_cobertura` itself, so neither is a local requirement.
Lighthouse needs Node 22.19 or newer and the Chromium Playwright installs. A
push to `main` always runs every job, because a deploy replaces the whole site
and would otherwise drop the reports.
