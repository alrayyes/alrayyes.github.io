// The catalogue this page renders. A docs link is only included once its URL
// has actually been checked to resolve (curl -o /dev/null -w '%{http_code}')
// — see the PR description for which SDKs don't have one yet and why.
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

export const apis: Api[] = [
  {
    name: "hush-hush",
    description:
      "Self-hosted secrets object store: age-sealed ciphertext, no plaintext ever stored or returned.",
    repo: "https://github.com/alrayyes/Hush-Hush",
    spec: "https://github.com/alrayyes/Hush-Hush/blob/main/api/openapi.yaml",
    docs: "https://apis.ryankes.eu/Hush-Hush/docs/api/#description/introduction",
    sdks: [
      {
        language: "PHP",
        repo: "https://github.com/alrayyes/hush-hush-php",
        docs: "https://alrayyes.github.io/hush-hush-php/",
      },
      {
        language: "Node.js / TypeScript",
        repo: "https://github.com/alrayyes/hush-hush-node",
        docs: "https://alrayyes.github.io/hush-hush-node/",
      },
      {
        language: "Python",
        repo: "https://github.com/alrayyes/hush-hush-python",
        docs: "https://alrayyes.github.io/hush-hush-python/",
      },
      {
        language: "Go",
        repo: "https://github.com/alrayyes/hush-hush-go",
        docs: "https://pkg.go.dev/github.com/alrayyes/hush-hush-go",
      },
    ],
  },
  {
    name: "forge-dashboard",
    description:
      "A single-page dashboard of open pull requests, issues, and CI/CD status across GitHub and Forgejo repositories.",
    repo: "https://github.com/alrayyes/forge-dashboard",
    spec: "https://github.com/alrayyes/forge-dashboard/blob/main/api/openapi.yaml",
    docs: "https://apis.ryankes.eu/forge-dashboard/docs/api/#description/introduction",
    sdks: [
      {
        language: "PHP",
        repo: "https://github.com/alrayyes/forge-dashboard-sdk-php",
        docs: "https://alrayyes.github.io/forge-dashboard-sdk-php/",
      },
      {
        language: "Node.js / TypeScript",
        repo: "https://github.com/alrayyes/forge-dashboard-sdk-node",
        docs: "https://alrayyes.github.io/forge-dashboard-sdk-node/",
      },
      {
        language: "Python",
        repo: "https://github.com/alrayyes/forge-dashboard-sdk-python",
        docs: "https://alrayyes.github.io/forge-dashboard-sdk-python/",
      },
      {
        language: "Go",
        repo: "https://github.com/alrayyes/forge-dashboard-sdk-go",
        docs: "https://pkg.go.dev/github.com/alrayyes/forge-dashboard-sdk-go",
      },
    ],
  },
  {
    name: "pipeline-analytics",
    description: "Self-hosted pipeline analytics for GitHub Actions and Forgejo Actions.",
    repo: "https://github.com/alrayyes/pipeline-analytics",
    spec: "https://github.com/alrayyes/pipeline-analytics/blob/main/openapi/openapi.yaml",
    // No docs link yet -- the repo has a docs/api/index.html but no Pages
    // deploy workflow, so apis.ryankes.eu/pipeline-analytics/docs/api/
    // still 404s. Tracked in alrayyes/pipeline-analytics#322.
    sdks: [
      {
        language: "PHP",
        repo: "https://github.com/alrayyes/pipeline-analytics-sdk-php",
        docs: "https://alrayyes.github.io/pipeline-analytics-sdk-php/",
      },
      {
        language: "Node.js / TypeScript",
        repo: "https://github.com/alrayyes/pipeline-analytics-sdk-node",
        docs: "https://alrayyes.github.io/pipeline-analytics-sdk-node/",
      },
      {
        language: "Python",
        repo: "https://github.com/alrayyes/pipeline-analytics-sdk-python",
        docs: "https://alrayyes.github.io/pipeline-analytics-sdk-python/",
      },
      {
        language: "Go",
        repo: "https://github.com/alrayyes/pipeline-analytics-sdk-go",
        docs: "https://pkg.go.dev/github.com/alrayyes/pipeline-analytics-sdk-go",
      },
    ],
  },
];
