# alrayyes.github.io

[![CI](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/alrayyes/alrayyes.github.io/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/alrayyes/alrayyes.github.io?sort=semver)](https://github.com/alrayyes/alrayyes.github.io/releases/latest)
[![licence](https://img.shields.io/badge/licence-GPL--3.0--or--later-blue.svg)](LICENSE)

A catalogue of the public HTTP APIs I maintain, deployed at
[apis.ryankes.eu](https://apis.ryankes.eu). For each API it links the
service's own GitHub repo, its OpenAPI spec, and every generated SDK
(repo and, where one is published, its API-reference docs site).

The catalogue itself is `src/data/apis.ts` — adding a new API or SDK is a
plain data-file edit, not a template change.

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
bun run test                  # playwright, against the built site

bun run lint                  # biome check ., the check-only form
bun run format                # biome check --write ., the fixer

bun run format:check          # prettier --check (md/yml/astro), add --write to fix
bun run lint:md
bun run lint:prose            # vale
bun run lint:mechanics        # ltex-cli-plus
bun run lint:tailwind         # oxlint, shadcn/lint's Tailwind rules
```

## Deployment

`.github/workflows/pages.yml` builds the site and deploys it to GitHub
Pages on every push to `main`, served at the custom domain
`apis.ryankes.eu` (`public/CNAME`, with a DNS `CNAME` record pointed at
`alrayyes.github.io`).
