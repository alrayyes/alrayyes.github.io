import { renderedHtml } from "../../.storybook/rendered";

export default { title: "Components/SiteHeader" };

export const Home = { render: () => renderedHtml("SiteHeader", "Home") };
export const Subpage = { render: () => renderedHtml("SiteHeader", "Subpage") };
