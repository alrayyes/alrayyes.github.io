// The repos that publish reports but aren't in the API catalogue, loaded from
// repos.json and described by repos.schema.json (checked by
// tests/repos-schema.spec.ts). A report link is only included once its URL has
// been checked to resolve (curl -o /dev/null -w '%{http_code}').

import type { Reports } from "../lib/reportLinks";
import type { Badge } from "./apis";
import data from "./repos.json";

export interface OtherRepo {
  name: string;
  kind: string;
  repo: string;
  reports: Reports;
  license: string;
  badges: Badge[];
}

export const otherRepos = data.repos as OtherRepo[];
