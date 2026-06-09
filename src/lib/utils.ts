import { MemberStatus } from "@/generated/prisma/enums";

export const MANDATE_COLORS = [
  "#d95f3b", // muted orange-red
  "#FFC64F", // amber
  "#3d7a6e", // muted forest
  "#c47a8a", // muted rose
  "#6aacb8", // soft cyan
  "#d4943a", // muted orange
  "#5b7fa6", // muted blue
  "#3d5a8a", // deep navy
  "#7b51c8", // violet
  "#ec008c", // magenta
  "#7ac143", // leaf green
  "#00aeef", // sky blue
  "#f47b20", // warm orange
  "#6b9e7a", // sage
  "#9e7a8c", // dusty mauve
  "#4e8a8c", // slate teal
] as const;

export function getMandateColor(colorIndex: number, customColor?: string | null): string {
  if (customColor) return customColor;
  return MANDATE_COLORS[colorIndex % MANDATE_COLORS.length];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export function formatFullDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const STATUS_LABELS: Record<MemberStatus, string> = {
  NEWBIE: "Newbie",
  CANDIDATE_MEMBER: "Candidate Member",
  JUNIOR: "Junior",
  SENIOR: "Senior",
  ALUMNI: "Alumni",
};

export const STATUS_COLORS: Record<
  MemberStatus,
  { bg: string; text: string }
> = {
  NEWBIE:           { bg: "#f5f5f5", text: "#525252" },
  CANDIDATE_MEMBER: { bg: "#e0f2fe", text: "#0369a1" },
  JUNIOR:           { bg: "#dcfce7", text: "#15803d" },
  SENIOR:           { bg: "#ede9fe", text: "#6d28d9" },
  ALUMNI:           { bg: "#f5f5f5", text: "#737373" },
};

export function latestStatus(
  history: { status: MemberStatus; startedAt: Date | string }[]
): MemberStatus {
  if (!history.length) return "NEWBIE";
  return [...history].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )[0].status;
}

// Status the member held as of a given date (useful for mandate-period views)
export function statusAtDate(
  history: { status: MemberStatus; startedAt: Date | string }[],
  asOf: Date
): MemberStatus {
  const relevant = history.filter(h => new Date(h.startedAt) <= asOf);
  if (!relevant.length) return "NEWBIE";
  return [...relevant].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )[0].status;
}

export const STATUS_RANK: Record<MemberStatus, number> = {
  SENIOR: 0,
  JUNIOR: 1,
  CANDIDATE_MEMBER: 2,
  NEWBIE: 3,
  ALUMNI: 4,
};

// Returns a sort priority for a role within a department that has known
// ordered positions (Board, Chairing, Audit). Returns 99 for others.
export function deptRoleOrder(dept: string, roleTitle: string): number {
  const r = roleTitle.toLowerCase();
  const d = dept.toLowerCase();
  if (d === "board") {
    if (r.includes("president") && !r.includes("vice")) return 0;
    if (r.includes("vice") || r.startsWith("vp")) return 1;
    if (r.includes("treasurer") || r.includes("tesourei")) return 2;
    return 99;
  }
  if (d.includes("chair")) {
    if (r.includes("president") && !r.includes("vice")) return 0;
    if ((r.includes("1") || r.includes("first")) && r.includes("secretar")) return 1;
    if ((r.includes("2") || r.includes("second")) && r.includes("secretar")) return 2;
    if (r.includes("secretar")) return 3;
    return 99;
  }
  if (d.includes("audit") || d.includes("fiscal")) {
    if (r.includes("president") && !r.includes("vice")) return 0;
    if (r.includes("secretar")) return 1;
    if (r.includes("reporter") || r.includes("relator")) return 2;
    return 99;
  }
  return 99;
}

// Departments that sort by role title rather than member status
export function isRoleSortedDept(dept: string): boolean {
  const d = dept.toLowerCase();
  return d === "board" || d.includes("chair") || d.includes("audit") || d.includes("fiscal");
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
