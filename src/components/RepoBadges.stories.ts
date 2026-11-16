import { renderedHtml } from "../../.storybook/rendered";

export default { title: "Components/RepoBadges" };

export const WithBadges = { render: () => renderedHtml("RepoBadges", "WithBadges") };
export const NoBadges = { render: () => renderedHtml("RepoBadges", "NoBadges") };
