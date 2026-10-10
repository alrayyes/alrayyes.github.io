import { describe, expect, test } from "bun:test";
import { buildSnapshot, combine, statusOf, workflowsOf } from "./ci-status";

const badge = (kind: string, image: string) => ({ kind, label: kind, image });
const ciBadge = (file: string, query = "") =>
  badge("ci", `https://github.com/alrayyes/x/actions/workflows/${file}/badge.svg${query}`);

describe("workflowsOf", () => {
  test("reads each CI badge's workflow file, and its branch when the badge names one", () => {
    expect(
      workflowsOf([
        ciBadge("ci.yml", "?branch=main"),
        badge("coverage", "https://codecov.io/gh/alrayyes/x/graph/badge.svg"),
        ciBadge("lint.yml"),
      ]),
    ).toEqual([{ file: "ci.yml", branch: "main" }, { file: "lint.yml" }]);
  });

  test("is empty when there is no CI badge", () => {
    expect(
      workflowsOf([badge("license", "https://img.shields.io/badge/licence-MIT-blue")]),
    ).toEqual([]);
  });

  test("ignores a CI badge that isn't a workflow badge", () => {
    expect(workflowsOf([badge("ci", "https://ci.example.test/badge.svg")])).toEqual([]);
  });
});

describe("statusOf", () => {
  test("is the newest run that succeeded or failed", () => {
    expect(statusOf(["success", "failure"])).toBe("passing");
    expect(statusOf(["failure", "success"])).toBe("failing");
  });

  test("counts timeouts, startup failures and a wait for approval as failing", () => {
    for (const conclusion of ["timed_out", "startup_failure", "action_required"]) {
      expect(statusOf([conclusion])).toBe("failing");
    }
  });

  test("skips runs that say nothing about the code", () => {
    expect(statusOf(["cancelled", "skipped", null, "neutral", "success"])).toBe("passing");
  });

  test("is unknown with no usable run", () => {
    expect(statusOf([])).toBe("unknown");
    expect(statusOf(["cancelled", null])).toBe("unknown");
  });
});

describe("combine", () => {
  test("fails when any workflow fails", () => {
    expect(combine(["passing", "failing", "unknown"])).toBe("failing");
  });

  test("passes when every known workflow passes, and ignores unknown ones", () => {
    expect(combine(["passing", "unknown", "passing"])).toBe("passing");
  });

  test("is unknown when nothing is known", () => {
    expect(combine([])).toBe("unknown");
    expect(combine(["unknown"])).toBe("unknown");
  });
});

describe("buildSnapshot", () => {
  const entries = [
    { name: "good", repo: "https://github.com/alrayyes/good", badges: [ciBadge("ci.yml")] },
    {
      name: "bad",
      repo: "https://github.com/alrayyes/bad",
      badges: [ciBadge("ci.yml"), ciBadge("lint.yml")],
    },
    { name: "none", repo: "https://github.com/alrayyes/none", badges: [] },
  ];
  const now = new Date("2026-10-10T12:00:00Z");
  const runs: Record<string, string[]> = {
    "alrayyes/good/ci.yml": ["success"],
    "alrayyes/bad/ci.yml": ["success"],
    "alrayyes/bad/lint.yml": ["failure", "success"],
  };

  test("gives each repo with CI one status and stamps when it was read", async () => {
    const snapshot = await buildSnapshot({
      entries,
      now,
      fetchRuns: async (repo, file) => runs[`${repo}/${file}`] ?? [],
    });
    expect(snapshot).toEqual({
      checkedAt: "2026-10-10T12:00:00.000Z",
      repos: { good: "passing", bad: "failing" },
    });
  });

  test("passes the badge's branch on to the lookup", async () => {
    const seen: (string | undefined)[] = [];
    await buildSnapshot({
      entries: [
        {
          name: "x",
          repo: "https://github.com/alrayyes/x",
          badges: [ciBadge("ci.yml", "?branch=master")],
        },
      ],
      now,
      fetchRuns: async (_repo, _file, branch) => {
        seen.push(branch);
        return ["success"];
      },
    });
    expect(seen).toEqual(["master"]);
  });

  test("keeps a repo's previous status when its lookup fails", async () => {
    const snapshot = await buildSnapshot({
      entries,
      now,
      previous: {
        checkedAt: "2026-10-09T00:00:00.000Z",
        repos: { good: "failing", bad: "passing" },
      },
      fetchRuns: async (repo, file) => {
        if (repo.endsWith("/good")) throw new Error("boom");
        return runs[`${repo}/${file}`] ?? [];
      },
    });
    expect(snapshot?.repos).toEqual({ good: "failing", bad: "failing" });
  });

  test("is unknown for a failed lookup with nothing to fall back on", async () => {
    const snapshot = await buildSnapshot({
      entries,
      now,
      fetchRuns: async (repo, file) => {
        if (repo.endsWith("/good")) throw new Error("boom");
        return runs[`${repo}/${file}`] ?? [];
      },
    });
    expect(snapshot?.repos.good).toBe("unknown");
  });

  test("writes nothing when every lookup fails", async () => {
    const snapshot = await buildSnapshot({
      entries,
      now,
      fetchRuns: async () => {
        throw new Error("offline");
      },
    });
    expect(snapshot).toBeNull();
  });
});
