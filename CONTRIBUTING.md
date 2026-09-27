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
  go install github.com/errata-ai/vale/v3/cmd/vale@latest
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

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint at commit time and again in CI against every commit on a pull
request. The pull request's own title matters too: a squash merge defaults
the merged commit's message to the PR title, and release-please reads that
landed message to decide the next version — `pr-title.yml` checks it the
same way commitlint checks a commit.

## Adding an API or SDK

Edit `src/data/apis.ts` — one entry per API, with a `sdks` array per
language. A docs link only belongs there once it's confirmed to actually
resolve; see the data file's own header comment.
