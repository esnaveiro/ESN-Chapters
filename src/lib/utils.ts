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

/** Sort priority: Board → Managers → Coordinators → Chairing → Audit → Support → General. */
export function deptSectionOrder(dept: string): number {
  const d = dept.toLowerCase().trim();
  if (d === "board") return 0;
  if (d.includes("manager")) return 1;
  if (d.includes("coordinator")) return 2;
  if (d.includes("chair")) return 3;
  if (d.includes("audit") || d.includes("fiscal")) return 4;
  if (d.includes("support")) return 5;
  if (d === "general") return 99;
  return 50;
}

/** Departments that get their own named section (others collapse into General). */
export function isNamedSection(dept: string): boolean {
  const d = dept.toLowerCase().trim();
  return d === "board"
    || d.includes("audit") || d.includes("fiscal")
    || d.includes("chair")
    || d.includes("coordinator")
    || d.includes("manager")
    || d.includes("support");
}

const isGenericRole = (role: string) => {
  const r = role.trim().toLowerCase();
  return !r || r === "member";
};

/** Formats a single department+role pair for display (drops a generic "Member" role). */
function formatDeptRole(dept: string, role: string): string {
  const d = dept.trim();
  if (isGenericRole(role)) return d || role.trim();
  return [d, role.trim()].filter(Boolean).join(" · ");
}

/**
 * Expands a membership's aligned departments[]/roleTitles[] into the section
 * slots it should occupy. Named-section departments (Board, Coordinators, …)
 * each get their own slot, and EVERY member also gets a single "General" slot
 * so they appear once in the general roster regardless of their positions.
 * Multiple non-named departments collapse into that one General slot so a member
 * isn't listed repeatedly.
 */
export function membershipSlots(
  departments: string[],
  roleTitles: string[]
): { section: string; role: string }[] {
  if (departments.length === 0) {
    return [{ section: "General", role: roleTitles.filter(Boolean).join(" · ") }];
  }
  const slots: { section: string; role: string }[] = [];
  const generalParts: string[] = [];
  for (let i = 0; i < departments.length; i++) {
    const dept = departments[i]?.trim() ?? "";
    const role = roleTitles[i] ?? "";
    if (dept && isNamedSection(dept)) slots.push({ section: dept, role });
    else {
      const part = formatDeptRole(dept, role);
      if (part) generalParts.push(part);
    }
  }
  slots.push({ section: "General", role: generalParts.join(" · ") });
  return slots;
}

/** Inline one-line summary of a member's departments/roles in a mandate. */
export function formatMembershipRoles(departments: string[], roleTitles: string[]): string {
  if (departments.length === 0) return roleTitles.filter(Boolean).join(" · ");
  const parts: string[] = [];
  for (let i = 0; i < departments.length; i++) {
    const part = formatDeptRole(departments[i]?.trim() ?? "", roleTitles[i] ?? "");
    if (part) parts.push(part);
  }
  return parts.join(" · ");
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
