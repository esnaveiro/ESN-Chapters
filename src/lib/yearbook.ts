export function sectionId(year: string) {
  return `cohort-${year.replace("/", "-")}`;
}
