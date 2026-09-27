import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

// A one-entry collection pointing outside the default content dir at this
// repo's own CHANGELOG.md (release-please's own output), rendered as-is on
// /changelog (src/pages/changelog.astro) rather than duplicated or
// summarised. Same pattern washy-washy-web's own content.config.ts uses.
export const collections = {
  changelog: defineCollection({
    loader: glob({ pattern: "CHANGELOG.md", base: "." }),
  }),
};
