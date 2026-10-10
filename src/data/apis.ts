// The catalogue this page renders, loaded from apis.json and described by
// apis.schema.json (checked by tests/catalogue-schema.spec.ts). A docs link is
// only included once its URL has actually been checked to resolve
// (curl -o /dev/null -w '%{http_code}').
import type { Reports } from "../lib/reportLinks";
import catalogue from "./apis.json";

export type BadgeKind = "ci" | "coverage" | "release" | "license" | "deployment" | "other";

// A badge from the repo's README, described by the `badge` definition in
// apis.schema.json.
export interface Badge {
  kind: BadgeKind;
  label: string;
  image: string;
  href: string;
}

export interface Sdk {
  language: string;
  repo: string;
  docs?: string;
  reports?: Reports;
  license: string;
  badges: Badge[];
}

export interface Api {
  name: string;
  description: string;
  repo: string;
  spec: string;
  docs?: string;
  reports?: Reports;
  license: string;
  badges: Badge[];
  sdks: Sdk[];
  // The id of an `api` group in repos.json, shared with the extra repos in this API's card.
  group?: string;
}

export const apis = catalogue.apis as Api[];
