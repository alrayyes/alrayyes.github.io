# Contributing

This file is for whoever changes this codebase. The [README](README.md) is
for whoever runs it.

## Getting set up

- **[bun](https://bun.sh) 1.3 or newer.** Runtime, test runner, package
  manager for the linter, and the [lefthook](https://lefthook.dev) that
  runs the git hooks — bun is the only thing to install.
- **[Vale](https://vale.sh)** on your `PATH`, for the style tier of the
  prose lint:

  ```sh
  go install github.com/errata-ai/vale/v3/cmd/vale@v3.17.1
  ```

  `ltex-cli-plus` needs nothing installed: the hook fetches and caches it
  on first use.

One command installs the linter, the git hooks, and their dependencies:

```sh
bun install
```

An uninstalled hook silently does nothing, which is worse than not having
one, so the `prepare` script runs `lefthook install` for you.

## Everyday commands

See [README.md](README.md#everyday-commands).

## Tests

Two layers, each there because the other can't cover it:

- **Unit** (`bun run test:unit`): `bun test` over the `*.test.ts` files
  beside the code in `src/lib`. They pin each branch and edge case of the
  pure logic, such as the licence splitter and the theme preference, in
  milliseconds and without a browser.
- **End to end** (`bun run test:e2e`): Playwright against the built site,
  one journey per page with an axe scan inside it. They check what a
  visitor sees and does, which the unit layer can't.

Logic goes in `src/lib` with a unit test beside it. A behaviour a visitor
can see gets a Playwright journey. `bun run test` runs both.
CI uploads the unit layer's line coverage (`bun run test:coverage`) to
Codecov. It's there to look at, not a gate: `codecov.yml` turns off the
status checks and the pull request comment.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint at commit time and again in CI against every commit on a pull
request. The pull request's own title matters too: a squash merge defaults
the merged commit's message to the PR title, and release-please reads that
landed message to decide the next version — `pr-title.yml` checks it the
same way commitlint checks a commit.

Merge pull requests with **squash merge** only. A merge commit puts two
commits with the same message on `main`, the branch commit, and the merge
commit, and the changelog and release notes then list the change twice.

## Adding an API or SDK

Edit `src/data/apis.json` — one entry per API, with a `sdks` array per
language. A docs link only belongs there once it's confirmed to actually
resolve. The file is validated against `src/data/apis.schema.json` by
`bun run test`, and editors that read `$schema` check it as you type.

## Releases

Only changes to the shipped site cut a release: `src/`, `public/` and the
build settings. Commits that change only `docs/`, `tests/`, `openspec/`,
`.claude/`, `.github/`, `scripts/` or the top-level Markdown files are
excluded in `release-please-config.json` (`exclude-paths`), so they never
open a release pull request, whatever their commit type.
