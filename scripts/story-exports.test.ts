import { expect, test } from "bun:test";
import { exportNames, missingStories } from "./story-exports";

test("exportNames lists each named const export and skips the default", () => {
  const source = `
    import x from "./x";
    export default { title: "X" };
    export const Passing = { render: () => x.Passing };
    export const Failing = {};
    const notExported = 1;
  `;
  expect(exportNames(source)).toEqual(["Passing", "Failing"]);
});

test("missingStories names states with no story and stories with no state", () => {
  expect(missingStories(["A", "B"], ["B", "C"])).toEqual({
    noStory: ["A"],
    noState: ["C"],
  });
  expect(missingStories(["A"], ["A"])).toEqual({ noStory: [], noState: [] });
});
