// Each repo's average Lighthouse scores, loaded from lighthouse-scores.json.
// scripts/lighthouse-repos.ts writes it: the `build` job in ci.yml runs it just
// before the deploy build, and the copy in git is a seed so a local build and the
// tests don't need the network.
import snapshot from "./lighthouse-scores.json";

export const lighthouseRepoScores = Object.fromEntries(
  Object.entries(snapshot.repos).map(([name, { scores }]) => [
    name,
    scores as Record<string, number>,
  ]),
);
