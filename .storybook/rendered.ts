// The markup `bun run storybook:render` wrote for each component state, one
// JSON file per component. A story looks its own state up here.
const files = import.meta.glob<Record<string, string>>("./rendered/*.json", {
  eager: true,
  import: "default",
});

export function renderedHtml(component: string, state: string): string {
  const html = files[`./rendered/${component}.json`]?.[state];
  if (html === undefined) {
    throw new Error(`No rendered markup for ${component}/${state}: run bun run storybook:render`);
  }
  return html;
}
