// Reads each repo's CI result from GitHub and writes it to
// src/data/ci-status.json, which the front page's CI filter and status labels
// build from. Run as `bun scripts/ci-status.ts [out-file]` from the repo root;
// the `build` job in ci.yml runs it just before `bun run build`, with the
// workflow's token.
//
// A repo's status comes from the workflows its README's CI badges name: the
// newest completed run on the badge's branch, or the default branch when the
// badge names none. A run that was cancelled or skipped says nothing about the
// code, so it is passed over. Failing wins over passing across a repo's
// workflows.
//
// A lookup that fails keeps that repo's previous status, and when every lookup
// fails the file is left alone, so a GitHub outage never publishes an empty
// snapshot.
import { readFileSync, writeFileSync } from "node:fs";

export type CiStatus = "passing" | "failing" | "unknown";

export interface Snapshot {
  checkedAt: string;
  repos: Record<string, CiStatus>;
}

interface BadgeLike {
  kind: string;
  image: string;
}

export interface Workflow {
  file: string;
  branch?: string;
}

export interface Entry {
  name: string;
  repo: string;
  badges: BadgeLike[];
}

// Conclusions newest first, for one workflow. null is a run still in progress.
export type FetchRuns = (repo: string, file: string, branch?: string) => Promise<(string | null)[]>;

const WORKFLOW_BADGE = /\/actions\/workflows\/([^/]+)\/badge\.svg(?:\?(.*))?$/;

export function workflowsOf(badges: BadgeLike[]): Workflow[] {
  const workflows: Workflow[] = [];
  for (const badge of badges) {
    if (badge.kind !== "ci") continue;
    const match = WORKFLOW_BADGE.exec(badge.image);
    if (!match?.[1]) continue;
    const branch = new URLSearchParams(match[2]).get("branch") ?? undefined;
    workflows.push(branch ? { file: match[1], branch } : { file: match[1] });
  }
  return workflows;
}

const PASSED = new Set(["success"]);
const FAILED = new Set(["failure", "timed_out", "startup_failure", "action_required"]);

export function statusOf(conclusions: (string | null)[]): CiStatus {
  for (const conclusion of conclusions) {
    if (conclusion && PASSED.has(conclusion)) return "passing";
    if (conclusion && FAILED.has(conclusion)) return "failing";
  }
  return "unknown";
}

export function combine(statuses: CiStatus[]): CiStatus {
  if (statuses.includes("failing")) return "failing";
  return statuses.includes("passing") ? "passing" : "unknown";
}

const slug = (repo: string) => repo.replace("https://github.com/", "");

export async function buildSnapshot({
  entries,
  fetchRuns,
  previous,
  now = new Date(),
}: {
  entries: Entry[];
  fetchRuns: FetchRuns;
  previous?: Snapshot;
  now?: Date;
}): Promise<Snapshot | null> {
  const withCi = entries.filter((entry) => workflowsOf(entry.badges).length > 0);
  let failed = 0;
  const looked = await Promise.all(
    withCi.map(async (entry): Promise<[string, CiStatus]> => {
      try {
        const statuses = await Promise.all(
          workflowsOf(entry.badges).map(async ({ file, branch }) =>
            statusOf(await fetchRuns(slug(entry.repo), file, branch)),
          ),
        );
        return [entry.name, combine(statuses)];
      } catch {
        failed++;
        return [entry.name, previous?.repos[entry.name] ?? "unknown"];
      }
    }),
  );
  if (withCi.length > 0 && failed === withCi.length) return null;
  return { checkedAt: now.toISOString(), repos: Object.fromEntries(looked) };
}

function githubFetchRuns(token: string | undefined): FetchRuns {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
  const get = async (path: string) => {
    const response = await fetch(`https://api.github.com${path}`, { headers });
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    return response.json();
  };
  const defaults = new Map<string, Promise<string>>();
  const defaultBranch = (repo: string) => {
    let branch = defaults.get(repo);
    if (!branch) {
      branch = get(`/repos/${repo}`).then(
        (body: { default_branch: string }) => body.default_branch,
      );
      defaults.set(repo, branch);
    }
    return branch;
  };
  return async (repo, file, branch) => {
    const on = encodeURIComponent(branch ?? (await defaultBranch(repo)));
    const body = (await get(
      `/repos/${repo}/actions/workflows/${file}/runs?branch=${on}&status=completed&per_page=10`,
    )) as { workflow_runs: { conclusion: string | null }[] };
    return body.workflow_runs.map((run) => run.conclusion);
  };
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

function readEntries(): Entry[] {
  const { apis } = readJson("src/data/apis.json");
  const { repos } = readJson("src/data/repos.json");
  const flat = [...apis.flatMap((api: Entry & { sdks: Entry[] }) => [api, ...api.sdks]), ...repos];
  return flat.map((entry: Entry & { repo: string }) => ({
    name: entry.repo.replace(/\/+$/, "").split("/").pop() ?? entry.repo,
    repo: entry.repo,
    badges: entry.badges,
  }));
}

if (import.meta.main) {
  const out = process.argv[2] ?? "src/data/ci-status.json";
  let previous: Snapshot | undefined;
  try {
    previous = readJson(out);
  } catch {}
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const snapshot = await buildSnapshot({
    entries: readEntries(),
    fetchRuns: githubFetchRuns(token),
    previous,
  });
  if (snapshot) {
    writeFileSync(out, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`wrote ${Object.keys(snapshot.repos).length} repos to ${out}`);
  } else {
    console.warn(`every lookup failed, so ${out} is unchanged`);
  }
}
