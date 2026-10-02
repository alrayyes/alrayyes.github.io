// The catalogue this page renders, loaded from apis.json and described by
// apis.schema.json (checked by tests/catalogue-schema.spec.ts). A docs link is
// only included once its URL has actually been checked to resolve
// (curl -o /dev/null -w '%{http_code}').
import catalogue from "./apis.json";

export interface Sdk {
  language: string;
  repo: string;
  docs?: string;
}

export interface Api {
  name: string;
  description: string;
  repo: string;
  spec: string;
  docs?: string;
  sdks: Sdk[];
}

export const apis: Api[] = catalogue.apis;
