# alrayyes.github.io

[![CI](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/alrayyes/alrayyes.github.io/graph/badge.svg)](https://codecov.io/gh/alrayyes/alrayyes.github.io)
[![release](https://img.shields.io/github/v/release/alrayyes/alrayyes.github.io?sort=semver)](https://github.com/alrayyes/alrayyes.github.io/releases/latest)
[![licence](https://img.shields.io/badge/licence-GPL--3.0--or--later-blue.svg)](LICENSE)

A directory of the public repos that publish test, coverage, or Lighthouse
reports, deployed at [apis.ryankes.eu](https://apis.ryankes.eu). The front page
lists every one A to Z with a filter, each API with its SDK repos under it and
the scaffolds together in one group. Lighthouse and test results are the
primary links on each row and go to the repo's own page at `/reports/<repo>/`,
each to its own section; coverage and the raw XML and `lcov.info` files are
secondary. For an API it also links the OpenAPI spec and the generated docs, and
each SDK is its own row.

The APIs and the SDK repos are in `src/data/apis.json`, validated by
`src/data/apis.schema.json`. Adding a new API or SDK is a plain data-file edit,
not a template change.

An API or SDK entry can also carry `reports`: links to the Lighthouse,
test-result and coverage reports (`lighthouse`, `tests`, `coverage`,
`coverageXml`) that its repo publishes at
`apis.ryankes.eu/<repo>/reports/` (this repo, being the user site, has no
prefix: see Reports below). Add a key only once its URL returns 200.

A repo that publishes reports but isn't an API, such as a scaffold, goes in
`src/data/repos.json`, validated by `src/data/repos.schema.json`, in the same
`reports` shape. The list and its sort, filter and kind chips are built from
both files by `src/lib/repoDirectory.ts`.

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

[apis.ryankes.eu/reports](https://apis.ryankes.eu/reports/) lists every repo's
published reports, one section per repo with a link to each file and its
format, and a filter to find a repo by name. The page is built from this site's
own reports and the two data files, so adding a repo's `reports` entry
updates it with the next deploy.

Each repo's section links to its own page, at `/reports/<repo>/`. The page opens
the repo's Lighthouse and test directories in the browser, reads the file names
from the index page its pipeline wrote there (GitHub Pages can't list a
directory), and shows one row per audited page with its four scores, and one row
per test file with its tests, failures, errors, skipped and time. Where a
directory has no index page, or JavaScript is off, it shows the links the
catalogue holds.

Every deploy also publishes this repo's own test and coverage reports under
that path:

- `tests/`: the JUnit XML of the unit and end-to-end runs, and Playwright's
  HTML report.
- `coverage/`: an HTML view, `coverage.xml` (Cobertura) and
  `lcov.info`.
- `lighthouse/`: an HTML and a JSON Lighthouse report for each page,
  from `scripts/lighthouse.sh` (`bun run lighthouse` runs it locally).

The `test` job writes the test and coverage reports, a `lighthouse` job writes
the Lighthouse ones, and the `reports` job runs `scripts/assemble-reports.ts` to
lay them out; the `build` job adds the result to the site. Lighthouse audits
each page in turn, except the `/reports/` pages, which only display other
reports. After each shard's audits, `scripts/lighthouse-insights.ts` fails the
job when a page scores below 1 on the render-blocking, network-dependency-tree,
unused-JavaScript or unused-CSS insight. The job is a matrix of shards
(`LIGHTHOUSE_SHARD=<n>/<total>` runs one slice locally). Add a shard to the
matrix in `ci.yml` when a shard gets close to its timeout.

The `test` job installs `lcov` (for `genhtml`) and `lcov_cobertura` itself, so
neither is a local requirement.
Lighthouse needs Node 22.19 or newer and the Chromium Playwright installs. A
push to `main` always runs every job, because a deploy replaces the whole site
and would otherwise drop the reports.
