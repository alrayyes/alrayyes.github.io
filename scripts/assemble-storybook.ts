// Gathers the Storybook catalogues CI built into the directory the site serves
// at /storybook/: one per catalogue, and a landing page linking them. Run it
// as `bun scripts/assemble-storybook.ts <in-dir> <out-dir>` after the
// `storybook` jobs have written `<in-dir>/<dir>/`. GitHub Pages has no
// directory listing, so the landing page is a page of its own.
//
// It refuses a catalogue with no stories: a build that lists none would
// deploy, replace the last good one and leave a link to an empty Storybook.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderIndex } from "./assemble-reports";

export const CATALOGUES = [
  { dir: "alrayyes-github-io", label: "alrayyes.github.io: the components of this site" },
  { dir: "forge-dashboard", label: "forge-dashboard: the Svelte components of the dashboard" },
] as const;

async function storyCount(dir: string): Promise<number> {
  const index = join(dir, "index.json");
  const body = await readFile(index, "utf8").catch(() => {
    throw new Error(`${index} is missing`);
  });
  const entries = Object.values<{ type: string }>(JSON.parse(body).entries ?? {});
  return entries.filter((e) => e.type === "story").length;
}

export async function assembleStorybook(inDir: string, outDir: string): Promise<void> {
  for (const { dir } of CATALOGUES) {
    if ((await storyCount(join(inDir, dir))) === 0) {
      throw new Error(`${dir} lists no stories`);
    }
  }
  await mkdir(outDir, { recursive: true });
  for (const { dir } of CATALOGUES) {
    await cp(join(inDir, dir), join(outDir, dir), { recursive: true });
  }
  const links = CATALOGUES.map(({ dir, label }) => ({ label, href: `${dir}/` }));
  await writeFile(join(outDir, "index.html"), renderIndex("Component catalogues", links));
}

if (import.meta.main) {
  const [inDir, outDir] = process.argv.slice(2);
  if (!inDir || !outDir) {
    console.error("usage: bun scripts/assemble-storybook.ts <in-dir> <out-dir>");
    process.exit(2);
  }
  await assembleStorybook(inDir, outDir);
  console.log(`assembled the catalogues into ${outDir}`);
}
