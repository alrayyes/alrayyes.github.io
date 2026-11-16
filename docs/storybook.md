# Component catalogue

Every component under `src/components/` has a story for each state worth seeing.
The catalogue is the inventory a design audit works from: it shows a row with a
failing build, a card with nothing in it and every colour scheme, which a
screenshot of one route misses.

## Why the stories aren't Astro

Storybook can't run `.astro` files in the browser. `storybook-astro` 0.2.1
claims to, but its production build on Astro 7 writes an empty bundle (the index
lists the story, the iframe chunk is 0 bytes), and it only declares support up
to Astro 6. So the catalogue uses `@storybook/html-vite` and renders the
components first:

1. `src/components/<Name>.fixtures.ts` lists each state as props, plus the page
   URL for a component that reads `Astro.url`.
2. `bun run storybook:render` loads those files through Vite with Astro's
   plugins, renders each state with Astro's container (the same code path as the
   site build) and writes `.storybook/rendered/<Name>.json`. Git ignores it.
3. `src/components/<Name>.stories.ts` has one export per state, and each shows
   that markup.

The render step fails if a state has no story or a story has no state.

## Running it

```sh
bun run storybook               # render, then browse at http://localhost:6006
bun run storybook:screenshots   # render, build, screenshot, scan with axe
bun run test:storybook          # smoke test: the build lists at least one story
```

The screenshot script writes one PNG per story and colour scheme to
`docs/storybook/` (git ignored), at 1280 by 800 with animations off, and scans
each page with axe. A story that throws, or any axe violation, fails the run
after every story has been tried. It needs Playwright's Chromium: run
`bunx playwright install chromium` once. `--only=<text>` keeps the stories whose
ID contains the text, and `--static-dir=<dir>` serves a build you already made.

The toolbar's Theme switch sets `data-theme` on the page, the way the site's own
toggle does.

## Adding a component

Add `<Name>.fixtures.ts` and `<Name>.stories.ts` next to it. Copy a pair that
exists. Sample data lives in `.storybook/sample.ts`, with inline `data:` images,
so a story never reaches the network.

## Where it is published

The `storybook` job in `.github/workflows/ci.yml` builds this catalogue, takes a
screenshot of every story in light and dark, and scans each with axe. It then
builds forge-dashboard's catalogue and assembles both with
`scripts/assemble-storybook.ts`. The deploy serves them at
<https://apis.ryankes.eu/storybook/>, one directory each: `alrayyes-github-io/`
and `forge-dashboard/`. The job refuses a catalogue that lists no stories, and
the deploy fetches both `index.json` files from the live site.

forge-dashboard doesn't publish its own catalogue, so the job checks out the
commit in `FD_REF` and builds it. No bot reads that pin: move it by hand when
the catalogue should change.

The screenshots are an artifact of the run, `storybook-screenshots`. Only this
site's catalogue gets screenshots and an axe scan. forge-dashboard's is
published as built.
