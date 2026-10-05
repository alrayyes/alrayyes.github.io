# 1. Deploy to GitHub Pages, not Cloudflare

Status: accepted

## Context

The site is a static catalogue of links with no server-side logic. This
account's other Astro sites deploy to Cloudflare Workers, so that is the
obvious default, and the one a later reader may propose.

The site is served at `apis.ryankes.eu`, and that domain is a DNS `CNAME`
onto `alrayyes.github.io`. The repo is named for the user Pages site, so
GitHub already serves its `main` build at that address.

## Decision

Build the site in CI and publish it with GitHub Pages
(`actions/deploy-pages`). `public/CNAME` carries the custom domain. There is
no Cloudflare Worker, no `wrangler` configuration and no Cloudflare secret.

## Consequences

- Nothing to host or pay for beyond the repo itself, and no deploy
  credential to rotate: the workflow's own `id-token` does it.
- The site can't use anything Workers offer. That costs nothing today, since
  every page is a plain file.
- The deploy differs from the other Astro sites on this account, so a
  scaffold fix for Workers deploys doesn't apply here.
- Moving to Cloudflare later means pointing the `CNAME` somewhere other
  than `alrayyes.github.io`, a DNS change with a short outage window.
