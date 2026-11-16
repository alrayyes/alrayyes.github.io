import { renderedHtml } from "../../.storybook/rendered";

export default { title: "Components/RepoRow" };

export const ApiPassing = { render: () => renderedHtml("RepoRow", "ApiPassing") };
export const FailingCi = { render: () => renderedHtml("RepoRow", "FailingCi") };
export const NoReports = { render: () => renderedHtml("RepoRow", "NoReports") };
export const SdkNested = { render: () => renderedHtml("RepoRow", "SdkNested") };
