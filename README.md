# alrayyes.github.io

[![CI](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/alrayyes/alrayyes.github.io/graph/badge.svg)](https://codecov.io/gh/alrayyes/alrayyes.github.io)
[![release](https://img.shields.io/github/v/release/alrayyes/alrayyes.github.io?sort=semver)](https://github.com/alrayyes/alrayyes.github.io/releases/latest)
[![licence](https://img.shields.io/badge/licence-GPL--3.0--or--later-blue.svg)](LICENSE)

A directory of my active public repos, deployed at
[apis.ryankes.eu](https://apis.ryankes.eu). Archived repos and forks aren't
listed. The front page lists every one with a filter, grouped into cards: each
API with its SDK repos under it, then the groups declared in
`src/data/repos.json`, then everything else. Product cards sit two to a row on
a wide screen, the scaffolds in a grid, and a strip of counts (repos, APIs,
SDK repos and CI passing) sits above the filter. Pressing `/` focuses the
filter, and Reset clears it. Each row shows the badges from the
repo's own README, and the filter narrows by name, kind, licence, and CI:
whether the latest run passed or failed. For the repos that publish them,
Lighthouse and test results are the primary links on a row. Lighthouse opens
`/reports/<repo>/lighthouse/` and Test results opens `/reports/<repo>/tests/`;
coverage and the raw XML and `lcov.info` files are secondary. For an API it also
links the OpenAPI spec and the generated docs, and each SDK is its own row.

The APIs and the SDK repos are in `src/data/apis.json`, validated by
`src/data/apis.schema.json`. Adding a new API or SDK is a plain data-file edit,
not a template change.

Every entry, whether API, SDK or other repo, also carries `badges` and
`license`. `badges` is the row of badge images from the top of the repo's
README, in README order: each has a `kind` (`ci`, `coverage`, `release`,
`license`, `deployment` or `other`), a `label` used as the image's alt text, the
`image` URL and the `href` it links to. Any GitHub Actions workflow badge is
`ci`, which is how the CI status knows which workflows to look up (see CI status
below). `license` is the SPDX id, or `Unlicensed`, and the licence filter lists
each value found in the data. Copy both from the README when you add an entry,
and leave `badges` empty when the README has none.

An API or SDK entry can also carry `reports`: links to the Lighthouse,
test-result and coverage reports (`lighthouse`, `tests`, `coverage`,
`coverageXml`) that its repo publishes at
`apis.ryankes.eu/<repo>/reports/` (this repo, being the user site, has no
prefix: see Reports below). Add a key only once its URL returns 200.

A repo that isn't an API, such as a scaffold, a Docker image or an action, goes
in `src/data/repos.json`, validated by `src/data/repos.schema.json`, in the same
`reports` shape. Leave `reports` empty when the repo publishes none: it still
gets a row with its badges and licence, but no report page. This site has an
entry there too, with empty `reports`, so its row gets badges and a licence like
any other; its report links come from the build. The list and its sort, filters
and kind chips are built from both files by `src/lib/repoDirectory.ts`.

The same file decides the grouping. Its top-level `groups` array declares each
group (`id`, `title`, `type` of `product` or `scaffolds`, and an optional
`description`), in display order, and a repo joins one with `"group": "<id>"`.
A group of type `api` adds repos to an API's card: the API in `src/data/apis.json`
names it with its own `group`, and the repos name it in `repos.json`. A repo with
no `group` lands under Everything else. A `group` that names an
undeclared id, or a group with no members, fails `bun run test:e2e`.

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
"Run workflow" button redeploys by hand, through the same gates, and so does a
scheduled run every six hours. The reason for GitHub Pages over Cloudflare is in
[the deployment decision record](docs/adr/0001-deploy-to-github-pages.md).

## CI status

The front page says whether each repo's latest CI run passed or failed, and the
CI filter can show only one or the other. The page can't read a badge image from
another origin, so `scripts/ci-status.ts` asks GitHub instead. For every repo
with a CI badge it takes the workflows the badge names, finds the newest
finished run on the badge's branch (the default branch when it names none), and
writes `src/data/ci-status.json`. A cancelled or skipped run is passed over, a
repo is failing if any of its workflows is, and a repo with no usable run shows
no status.

The `build` job runs the script just before `bun run build`, so the status is as
old as the last deploy, at most about six hours. The page says when it was read.
Nothing commits the file: the copy in git is a seed that keeps a local build and
the tests off the network, so a local `bun run dev` shows the seed's date. If a
lookup fails the repo keeps its previous status, and if all of them fail the file
is left alone. Run it by hand with `GITHUB_TOKEN=$(gh auth token) bun
scripts/ci-status.ts`; without a token GitHub allows only 60 requests an hour,
which one run uses up.

## Reports

[apis.ryankes.eu/reports](https://apis.ryankes.eu/reports/) lists every repo's
published reports, one section per repo with a link to each file and its
format, and a filter to find a repo by name. The page is built from this site's
own reports and the two data files, so adding a repo's `reports` entry
updates it with the next deploy.

Each repo has a page for its Lighthouse reports, at `/reports/<repo>/lighthouse/`,
and one for its test results, at `/reports/<repo>/tests/`, and only for a report
it publishes. `/reports/<repo>/` is an overview with the coverage links and a
link to each of those pages. A report page opens the repo's directory in the
browser, reads the file names
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
