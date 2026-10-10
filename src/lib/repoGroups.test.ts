import { describe, expect, test } from "bun:test";
import { groupProblems } from "./repoGroups";

const groups = [
  { id: "washy-washy", title: "washy-washy", type: "product" as const },
  { id: "scaffolds", title: "Scaffolds", type: "scaffolds" as const },
];

describe("groupProblems", () => {
  test("finds nothing wrong when every group has a member and every repo names a declared group", () => {
    const repos = [
      { name: "a", group: "washy-washy" },
      { name: "b", group: "scaffolds" },
      { name: "c" },
    ];
    expect(groupProblems(groups, repos)).toEqual([]);
  });

  test("flags a repo that names a group nobody declared", () => {
    const repos = [
      { name: "a", group: "washy-washy" },
      { name: "b", group: "scaffolds" },
      { name: "c", group: "nope" },
    ];
    expect(groupProblems(groups, repos)).toEqual(['c names the undeclared group "nope"']);
  });

  test("flags a declared group with no member", () => {
    expect(groupProblems(groups, [{ name: "a", group: "washy-washy" }])).toEqual([
      'the group "scaffolds" has no member',
    ]);
  });

  test("flags a group id declared twice", () => {
    const repos = [
      { name: "a", group: "washy-washy" },
      { name: "b", group: "scaffolds" },
    ];
    expect(groupProblems([...groups, groups[0]], repos)).toEqual([
      'the group "washy-washy" is declared twice',
    ]);
  });
});
