// Reads each repo's published Lighthouse reports and writes the average per
// repo to src/data/lighthouse-scores.json, which the front page's rows show as
// badges. The `build` job in ci.yml runs it just before `bun run build`. It
// runs at build time, not in the browser, because a fetch chain on the home
// page costs it a Lighthouse insight. The copy in git is a seed so a local build
// and the tests stay off the network.
//
// A repo's directory index page names one *.report.json per audited page; a link
// to a single report page stands for the directory it sits in. A lookup that
// fails keeps that repo's previous scores, and when every lookup fails the file
// is left alone. Run it as `bun scripts/lighthouse-repos.ts [out-file]`.
import { readFileSync, writeFileSync } from "node:fs";
import { averageOfReports, type LighthouseAverage } from "./lighthouse-average";

export interface Snapshot {
  repos: Record<string, LighthouseAverage>;
}

export interface Entry {
  name: string;
  lighthouse: string;
}

export type FetchText = (url: string) => Promise<string>;

export function jsonLinks(html: string): string[] {
  return [...html.matchAll(/href="([^"]+\.json)"/g)].flatMap((match) =>
    match[1] ? [match[1]] : [],
  );
}

// A link to one report page names its directory by what comes before the file.
export const directoryOf = (url: string): string => url.slice(0, url.lastIndexOf("/") + 1);

async function averageOfDirectory(url: string, fetchText: FetchText) {
  const names = jsonLinks(await fetchText(url));
  // An index can link a file that isn't a report, so one bad file isn't fatal.
  const settled = await Promise.allSettled(
    names.map(async (name) => JSON.parse(await fetchText(new URL(name, url).href))),
  );
  const reports = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const average = averageOfReports(reports);
  if (!average) throw new Error(`no readable report in ${url}`);
  return average;
}

export async function buildScores({
  entries,
  fetchText,
  previous,
}: {
  entries: Entry[];
  fetchText: FetchText;
  previous?: Snapshot;
}): Promise<Snapshot | null> {
  const directories = entries.map((entry) => ({
    name: entry.name,
    lighthouse: directoryOf(entry.lighthouse),
  }));
  let failed = 0;
  const looked = await Promise.all(
    directories.map(async (entry): Promise<[string, LighthouseAverage | undefined]> => {
      try {
        return [entry.name, await averageOfDirectory(entry.lighthouse, fetchText)];
      } catch {
        failed++;
        return [entry.name, previous?.repos[entry.name]];
      }
    }),
  );
  if (directories.length > 0 && failed === directories.length) return null;
  return {
    repos: Object.fromEntries(
      looked.flatMap(([name, average]) => (average ? [[name, average]] : [])),
    ),
  };
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

function readEntries(): Entry[] {
  const { apis } = readJson("src/data/apis.json");
  const { repos } = readJson("src/data/repos.json");
  type Raw = { repo: string; reports?: { lighthouse?: string }; sdks?: Raw[] };
  const flat: Raw[] = [...apis.flatMap((api: Raw) => [api, ...(api.sdks ?? [])]), ...repos];
  return flat.flatMap((entry) =>
    entry.reports?.lighthouse
      ? [
          {
            name: entry.repo.replace(/\/+$/, "").split("/").pop() ?? entry.repo,
            lighthouse: entry.reports.lighthouse,
          },
        ]
      : [],
  );
}

if (import.meta.main) {
  const out = process.argv[2] ?? "src/data/lighthouse-scores.json";
  let previous: Snapshot | undefined;
  try {
    previous = readJson(out);
  } catch {}
  const snapshot = await buildScores({
    entries: readEntries(),
    fetchText: async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.text();
    },
    previous,
  });
  if (snapshot) {
    writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(
      `wrote Lighthouse scores for ${Object.keys(snapshot.repos).length} repos to ${out}`,
    );
  } else {
    console.warn(`every lookup failed, so ${out} is unchanged`);
  }
}
