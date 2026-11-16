// Renders every component state the stories show.
//
//   bun run storybook:render
//
// An Astro component can't run in the browser, so Storybook never loads one.
// This script loads each `src/**/*.fixtures.ts` through Vite with Astro's own
// plugins, renders each state with Astro's container (the same code path as
// the build), and writes `.storybook/rendered/<Component>.json`. A story then
// shows that markup. storybook-astro would do this inside Storybook, but its
// production build is empty on Astro 7 (see docs/storybook.md).
//
// It also checks each fixtures file against its stories file: a state with no
// story, or a story with no state, fails the run.

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getViteConfig } from "astro/config";
import { createServer, type InlineConfig } from "vite";
import { exportNames, missingStories } from "./story-exports";

export interface StoryState {
  props?: Record<string, unknown>;
  // The page the component believes it is on, for one that reads Astro.url.
  url?: string;
  // An element to put the markup in, for a component that renders list items.
  wrap?: string;
}

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, ".storybook", "rendered");

async function fixtureFiles(dir: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await fixtureFiles(full)));
    else if (entry.name.endsWith(".fixtures.ts")) found.push(full);
  }
  return found;
}

async function main() {
  const astroConfig = await getViteConfig({})({ command: "serve", mode: "development" });
  const vite = await createServer({
    ...(astroConfig as InlineConfig),
    root: ROOT,
    server: { middlewareMode: true },
    appType: "custom",
    logLevel: "error",
    // Nothing to pre-bundle: skip the dependency scan, which reads every
    // .astro file's <script> as plain JavaScript and complains.
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  const problems: string[] = [];
  try {
    const { experimental_AstroContainer: AstroContainer } =
      await vite.ssrLoadModule("astro/container");
    const container = await AstroContainer.create();
    await rm(OUT, { recursive: true, force: true });
    await mkdir(OUT, { recursive: true });

    for (const file of (await fixtureFiles(path.join(ROOT, "src"))).sort()) {
      const name = path.basename(file, ".fixtures.ts");
      const { Component, states } = (await vite.ssrLoadModule(file)) as {
        Component: unknown;
        states: Record<string, StoryState>;
      };
      const stories = exportNames(
        await readFile(file.replace(".fixtures.ts", ".stories.ts"), "utf8"),
      );
      const { noStory, noState } = missingStories(Object.keys(states), stories);
      for (const s of noStory) problems.push(`${name}: state ${s} has no story`);
      for (const s of noState) problems.push(`${name}: story ${s} has no state`);

      const html: Record<string, string> = {};
      for (const [state, { props, url, wrap }] of Object.entries(states)) {
        const markup = await container.renderToString(Component, {
          props,
          request: new Request(new URL(url ?? "/", "https://apis.ryankes.eu")),
        });
        html[state] = wrap ? `<${wrap}>${markup}</${wrap}>` : markup;
      }
      await writeFile(path.join(OUT, `${name}.json`), `${JSON.stringify(html, null, 2)}\n`);
      console.log(`${name}: ${Object.keys(html).length} states`);
    }
  } finally {
    await vite.close();
  }
  if (problems.length > 0) {
    console.error(problems.map((p) => `- ${p}`).join("\n"));
    process.exit(1);
  }
}

await main();
