// What the story files and their fixtures must agree on: a story per state and
// a state per story. The indexer reads `export const` names, so that is what
// this reads too.
export function exportNames(source: string): string[] {
  return [...source.matchAll(/^\s*export const (\w+)\b/gm)].map((m) => m[1]);
}

export function missingStories(states: string[], stories: string[]) {
  return {
    noStory: states.filter((s) => !stories.includes(s)),
    noState: stories.filter((s) => !states.includes(s)),
  };
}
