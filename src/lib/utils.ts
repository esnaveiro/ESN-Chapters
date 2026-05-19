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

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
