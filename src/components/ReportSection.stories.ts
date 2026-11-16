import { renderedHtml } from "../../.storybook/rendered";

export default { title: "Components/ReportSection" };

export const Lighthouse = { render: () => renderedHtml("ReportSection", "Lighthouse") };
export const Tests = { render: () => renderedHtml("ReportSection", "Tests") };
export const Coverage = { render: () => renderedHtml("ReportSection", "Coverage") };
