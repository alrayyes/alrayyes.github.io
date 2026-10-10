// This site's average Lighthouse scores, loaded from lighthouse-average.json.
// scripts/lighthouse-average.ts writes it in the `build` job from the reports
// the pipeline just produced; the copy in git is a seed for local builds.
import snapshot from "./lighthouse-average.json";

export const lighthouseAverage: { pages: number; scores: Record<string, number> } | null =
  Object.keys(snapshot.scores).length > 0 ? snapshot : null;
