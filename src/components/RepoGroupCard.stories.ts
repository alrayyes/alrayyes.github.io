import { renderedHtml } from "../../.storybook/rendered";

export default { title: "Components/RepoGroupCard" };

export const ApiCard = { render: () => renderedHtml("RepoGroupCard", "ApiCard") };
export const ProductCard = { render: () => renderedHtml("RepoGroupCard", "ProductCard") };
export const ScaffoldsCard = { render: () => renderedHtml("RepoGroupCard", "ScaffoldsCard") };
export const OtherCard = { render: () => renderedHtml("RepoGroupCard", "OtherCard") };
