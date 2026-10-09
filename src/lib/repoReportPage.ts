// What a repo's report pages share: which of its files belong to one group,
// and which directory those files live in.
import { directoryOf } from "./reportDirectory";
import type { ReportFile, RepoSection } from "./reportsIndex";

export const filesOf = (section: RepoSection, group: ReportFile["group"]) =>
  section.files.filter((file) => file.group === group);

// The first file is a file or a directory link depending on the repo; either
// way its directory is where the repo's index page for the group lives.
export function directory(section: RepoSection, group: ReportFile["group"]) {
  const first = filesOf(section, group)[0];
  return first ? directoryOf(first.href) : undefined;
}
