// What repos.json's `groups` and each repo's `group` have to agree on. JSON
// Schema can't say "this string is one of those ids", so the schema test calls
// this on the real data.

export type GroupType = "product" | "scaffolds";

export interface RepoGroup {
  id: string;
  title: string;
  type: GroupType;
  description?: string;
}

export function groupProblems(
  groups: RepoGroup[],
  repos: { name: string; group?: string }[],
): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const { id } of groups) {
    if (ids.has(id)) problems.push(`the group "${id}" is declared twice`);
    ids.add(id);
  }
  for (const repo of repos) {
    if (repo.group !== undefined && !ids.has(repo.group)) {
      problems.push(`${repo.name} names the undeclared group "${repo.group}"`);
    }
  }
  for (const id of ids) {
    if (!repos.some((repo) => repo.group === id)) problems.push(`the group "${id}" has no member`);
  }
  return problems;
}
