// The newest CI result per repo, loaded from ci-status.json. scripts/ci-status.ts
// writes it: the `build` job in ci.yml runs it just before the deploy build, and
// the copy in git is a hand-made seed so a local build and the tests don't need
// the network. checkedAt says when it was read.
import type { CiStatus } from "../../scripts/ci-status";
import snapshot from "./ci-status.json";

export const ciStatuses = snapshot.repos as Record<string, CiStatus>;
export const ciCheckedAt: string = snapshot.checkedAt;
