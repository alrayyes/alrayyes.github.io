// What repos.json's `groups` and each repo's `group` have to agree on. JSON
// Schema can't say "this string is one of those ids", so the schema test calls
// this on the real data.

export type GroupType = "product" | "scaffolds" | "api";

export interface RepoGroup {
  id: string;
  title: string;
  type: GroupType;
  description?: string;
}

// `apis` are the catalogue's API entries: one may name an `api` group, which
// the repos joining it then share a card with.
export function groupProblems(
  groups: RepoGroup[],
  repos: { name: string; group?: string }[],
  apis: { name: string; group?: string }[] = [],
): string[] {
  const problems: string[] = [];
  const types = new Map<string, GroupType>();
  for (const { id, type } of groups) {
    if (types.has(id)) problems.push(`the group "${id}" is declared twice`);
    types.set(id, type);
  }
  for (const repo of repos) {
    if (repo.group !== undefined && !types.has(repo.group)) {
      problems.push(`${repo.name} names the undeclared group "${repo.group}"`);
    }
  }
  for (const api of apis) {
    if (api.group === undefined) continue;
    const type = types.get(api.group);
    if (type === undefined) {
      problems.push(`the API ${api.name} names the undeclared group "${api.group}"`);
    } else if (type !== "api") {
      problems.push(`the API ${api.name} names "${api.group}", which is not an api group`);
    }
  }
  for (const [id, type] of types) {
    if (type === "api") {
      if (!apis.some((api) => api.group === id)) {
        problems.push(`the api group "${id}" is named by no API`);
      }
    } else if (!repos.some((repo) => repo.group === id)) {
      problems.push(`the group "${id}" has no member`);
    }
  }
  return problems;
}
