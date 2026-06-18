/**
 * Pure parsing helpers for the Google Forms member-import feature.
 *
 * These have no database or framework dependencies so they can be exercised
 * directly against the responses spreadsheet (see the verification snippet in
 * the plan). Every helper that touches free-text returns the value it could
 * parse plus a list of human-readable warnings for anything it couldn't.
 */

import type {MemberStatus} from "@/generated/prisma/enums";

/* ── Column resolution ──────────────────────────────────────────── */

export type ImportColumn =
    | "fullName"
    | "linkedinUrl"
    | "joinMonth"
    | "bio"
    | "favouriteMemory"
    | "photoUpload"
    | "altPhoto"
    | "statusHistory"
    | "mandates"
    | "buddy"
    | "newbies";

/** Header-prefix → column key. Matched case-insensitively by `startsWith`. */
const COLUMN_PREFIXES: [ImportColumn, string][] = [
    ["fullName", "full name"],
    ["linkedinUrl", "linkedin"],
    ["joinMonth", "join month"],
    ["bio", "bio"],
    ["favouriteMemory", "favourite"],
    ["photoUpload", "photo upload"],
    ["altPhoto", "alternative"],
    ["statusHistory", "status history"],
    ["mandates", "mandate"],
    ["buddy", "my buddy"],
    ["newbies", "my newbies"],
];

/**
 * Maps each known field to its column index by matching the header row's text.
 * Order-independent, so the importer survives the form gaining/reordering
 * columns. Headers may contain embedded newlines (the form's help text).
 */
export function resolveColumns(headerRow: unknown[]): Partial<Record<ImportColumn, number>> {
    const map: Partial<Record<ImportColumn, number>> = {};
    headerRow.forEach((cell, i) => {
        const header = String(cell ?? "").trim().toLowerCase();
        if (!header) return;
        for (const [key, prefix] of COLUMN_PREFIXES) {
            if (map[key] === undefined && header.startsWith(prefix)) {
                map[key] = i;
                return;
            }
        }
    });
    return map;
}

/* ── Dates ──────────────────────────────────────────────────────── */

const MONTHS: Record<string, string> = {
    january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
    april: "04", apr: "04", may: "05", june: "06", jun: "06", july: "07", jul: "07",
    august: "08", aug: "08", september: "09", sep: "09", sept: "09",
    october: "10", oct: "10", november: "11", nov: "11", december: "12", dec: "12",
};

/**
 * "September 2022" / "Feb 2025" / "09 2023" → "2022-09-01".
 * Handles full or abbreviated month names and numeric months. Null if it can't
 * find a "<month> <4-digit-year>" pair (caller flags null).
 */
export function parseMonthYear(s: string): string | null {
    const t = s.trim();
    const named = t.match(/([A-Za-z]+)\.?\s+(\d{4})/);
    if (named) {
        const month = MONTHS[named[1].toLowerCase()];
        if (month) return `${named[2]}-${month}-01`;
    }
    const numeric = t.match(/^(\d{1,2})\s+(\d{4})$/);
    if (numeric) {
        const mm = Number(numeric[1]);
        if (mm >= 1 && mm <= 12) return `${numeric[2]}-${String(mm).padStart(2, "0")}-01`;
    }
    return null;
}

/** Join-month field. Returns the date string or null (caller flags null). */
export function parseJoinMonth(s: string): string | null {
    return parseMonthYear(s);
}

/* ── Name normalisation (matching key) ──────────────────────────── */

/** Trim, collapse whitespace, strip accents, lower-case. */
export function normalizeName(s: string): string {
    return s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

// Portuguese name connectors ignored when comparing (e.g. "Andrade e Castro").
const NAME_CONNECTORS = new Set(["de", "do", "da", "dos", "das", "e", "di", "du", "del", "la", "van", "von", "y"]);

/** Significant lower-cased name tokens (drops accents, punctuation, connectors, initials). */
export function nameTokens(s: string): string[] {
    return normalizeName(s)
        .replace(/[^a-z0-9\s]/g, " ") // strip punctuation, e.g. "Fernandes (Megs)" → "fernandes megs"
        .split(/\s+/)
        .filter((t) => t.length > 1 && !NAME_CONNECTORS.has(t));
}

/**
 * Fuzzy similarity between two names. Higher is better; 0 means no meaningful
 * overlap. Rewards shared tokens, one name's tokens being a subset of the
 * other's (people drop middle names on forms), and a shared surname.
 */
export function nameMatchScore(a: string, b: string): number {
    const at = nameTokens(a);
    const bt = nameTokens(b);
    if (!at.length || !bt.length) return 0;
    const aset = new Set(at);
    const bset = new Set(bt);
    let shared = 0;
    for (const t of aset) if (bset.has(t)) shared++;
    if (shared === 0) return 0;
    const [shorter, longerSet] = at.length <= bt.length ? [at, bset] : [bt, aset];
    const subset = shorter.every((t) => longerSet.has(t));
    const sameLast = at[at.length - 1] === bt[bt.length - 1];
    return shared * 2 + (subset ? 3 : 0) + (sameLast ? 2 : 0);
}

/** Normalise an academic-year string to canonical "YYYY/YY" (e.g. "25/26", "2025/2026" → "2025/26"). */
export function canonicalAcademicYear(s: string): string {
    const m = s.match(/(\d{2,4})\s*[/-]\s*(\d{2,4})/);
    if (!m) return s.trim();
    const start = m[1].length === 2 ? `20${m[1]}` : m[1];
    return `${start}/${m[2].slice(-2)}`;
}

/* ── Status history ─────────────────────────────────────────────── */

function matchStatusLabel(label: string): MemberStatus | null {
    const l = label.toLowerCase();
    if (l.includes("newbie")) return "NEWBIE";
    if (l.includes("candidate")) return "CANDIDATE_MEMBER";
    if (l.includes("junior")) return "JUNIOR";
    if (l.includes("senior")) return "SENIOR";
    if (l.includes("alumni") || l.includes("alumnus") || l.includes("alumna")) return "ALUMNI";
    return null;
}

export type ParsedStatus = { status: MemberStatus; startedAt: string };

/**
 * Parses a status-history block. Handles both layouts seen in the wild:
 *   "September 2022 - Newbie"          (status and date on one line)
 *   "Newbie\nFeb 2025 – Mar 2025\n…"   (status line, then a date-range line)
 * For a range the start date is used. Lines that yield neither a status nor a
 * date (e.g. "(Don't remember 2023) - Senior Member") are returned as warnings.
 */
export function parseStatusHistory(text: string): { entries: ParsedStatus[]; warnings: string[] } {
    const lines = splitLines(text);
    const entries: ParsedStatus[] = [];
    const warnings: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const status = matchStatusLabel(line);
        const date = parseMonthYear(line);
        if (status && date) {
            entries.push({status, startedAt: date});
        } else if (status && !date) {
            // Bare status label — the date is on the following (range) line.
            const next = lines[i + 1];
            const nextDate = next ? parseMonthYear(next) : null;
            if (nextDate && !matchStatusLabel(next)) {
                entries.push({status, startedAt: nextDate});
                i++; // consume the date line
            } else {
                warnings.push(line);
            }
        } else {
            warnings.push(line);
        }
    }
    entries.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    return {entries, warnings};
}

/* ── Mandate memberships (fuzziest field) ───────────────────────── */

export type MandateRole = { department: string | null; role: string };
export type ParsedMandate = {
    academicYear: string;
    roles: MandateRole[];
    raw: string;
};

/** Zips a membership's aligned departments[]/roleTitles[] into pairs. */
export function zipPairs(departments: string[], roleTitles: string[]): { department: string; role: string }[] {
    const n = Math.max(departments.length, roleTitles.length);
    return Array.from({length: n}, (_, i) => ({department: departments[i] ?? "", role: roleTitles[i] ?? ""}));
}

/** Case-insensitive key identifying a department+role pair (for de-duping). */
export function pairKey(department: string | null | undefined, role: string): string {
    return `${(department ?? "").trim().toLowerCase()}::${role.trim().toLowerCase()}`;
}

function splitList(s: string): string[] {
    return s
        .split(/[,&·•]|\band\b/i)
        .map((p) => p.trim())
        .filter(Boolean);
}

export type ClassifiedRole = MandateRole & { explicit: boolean };

// Real ESN departments, each with a regex matching the keyword(s) to strip out of the role title.
// Order matters: structural teams before the area abbreviations.
const DEPARTMENTS: { dept: string; strip: RegExp }[] = [
    {dept: "Board", strip: /\bboard\b/i},
    {dept: "Chairing Team", strip: /\b(?:chairing(?:\s+team)?|ct)\b/i},
    {dept: "Audit Team", strip: /\b(?:audit(?:\s+team)?|fiscal(?:\s+council)?)\b/i},
    {dept: "Support", strip: /\bsupport\b/i},
    {dept: "HR", strip: /\b(?:hr|human resources)\b/i},
    {dept: "IT", strip: /\b(?:it|information technology)\b/i},
    {dept: "BFC", strip: /\bbfc\b/i},
    {dept: "Communication", strip: /\b(?:comms?|communications?)\b/i},
    {dept: "Marketing", strip: /\bmarketing\b/i},
    {dept: "Education", strip: /\beducation\b/i},
    {dept: "Partnerships", strip: /\bpartnerships?\b/i},
    {dept: "Fundraising", strip: /\b(?:fundraising|fr)\b/i},
];
// Area departments whose lead role is "Manager" — a "Coordinator" title here is really the Manager.
const MANAGER_DEPTS = new Set(["HR", "IT", "Communication", "Marketing", "Education", "Partnerships", "Fundraising"]);

/**
 * Classifies a free-text role into a department + role title. `explicit` is true
 * when the department came from a keyword in the text (so it should win over any
 * department typed in a separate segment). ESN conventions:
 *   "HR Manager" / "HR Coordinator" → { HR, "Manager" }   (HR is a department; its lead is Manager)
 *   "HR" (nothing else)             → { HR, "Member" }
 *   "Audit Team Secretary"          → { Audit Team, "Secretary" }
 *   "WPA"                           → { Support, "WPA" }
 *   "Cultural Coordinator"          → { Coordinators, "Cultural Coordinator" }   (inferred)
 *   "Treasurer"                     → { Board, "Treasurer" }                     (inferred)
 */
export function classifyMandateRole(raw: string): ClassifiedRole {
    const text = raw.trim().replace(/\s+/g, " ");
    if (!text) return {department: null, role: "", explicit: false};

    if (/\bwpa\b/i.test(text)) return {department: "Support", role: "WPA", explicit: true};

    for (const {dept, strip} of DEPARTMENTS) {
        if (strip.test(text)) {
            let role = text.replace(strip, "").replace(/\s+/g, " ").trim();
            if (MANAGER_DEPTS.has(dept)) role = role.replace(/coordinator/i, "Manager");
            return {department: dept, role: role || "Member", explicit: true};
        }
    }

    // No department keyword — infer the department from the role title type.
    const low = text.toLowerCase();
    if (/coordinator/.test(low)) return {department: "Coordinators", role: text, explicit: false};
    if (/manager/.test(low)) return {department: "Managers", role: text, explicit: false};
    if (/\b(?:1st|2nd|3rd|first|second|third)\b.*secretar|assembly/.test(low))
        return {department: "Chairing Team", role: text, explicit: false};
    // President / Vice-President / Treasurer are definitively Board — they win over any typed department.
    if (/\bvice[-\s]?president\b|\bvice\b|\bvp\b|\bpresident\b|\btreasurer\b/.test(low))
        return {department: "Board", role: text, explicit: true};
    if (/secretar/.test(low)) return {department: "Board", role: text, explicit: false};
    if (low === "member") return {department: null, role: "Member", explicit: false};

    // An unrecognised token is taken to be a department name with a default "Member" role.
    return {department: text, role: "Member", explicit: false};
}

/**
 * Parses the multi-line "YY/YY - Dept(s) - Role(s)" block, best-effort.
 * Always approximate; callers should review-gate the result. Lines whose
 * leading token isn't a "YY/YY" academic year are returned as warnings.
 */
export function parseMandates(text: string): { mandates: ParsedMandate[]; warnings: string[] } {
    const mandates: ParsedMandate[] = [];
    const warnings: string[] = [];
    for (const raw of splitLines(text)) {
        const parts = raw.split(/\s+[-–—]\s+/);
        const yearMatch = parts[0].trim().match(/^(\d{2,4})\s*\/\s*(\d{2,4})$/);
        if (!yearMatch) {
            warnings.push(raw);
            continue;
        }
        const academicYear = canonicalAcademicYear(parts[0]);
        const rest = parts.slice(1);

        // 2+ segments → leading segment(s) are explicitly-typed departments, last
        // segment is the role(s). 1 segment → role(s)/department(s) only. Each role
        // becomes its own department+role pair.
        const explicitDepts =
            rest.length >= 2
                ? splitList(rest.slice(0, -1).join(", "))
                    .map((d) => classifyMandateRole(d).department)
                    .filter((d): d is string => Boolean(d))
                : [];
        const roleText = rest.length >= 1 ? rest[rest.length - 1] : "";

        const roles: MandateRole[] = [];
        const covered = new Set<string>();
        for (const tok of splitList(roleText)) {
            const c = classifyMandateRole(tok);
            // A department named inside the role token wins; otherwise pair with the typed department.
            const department = c.explicit ? c.department : explicitDepts[0] ?? c.department;
            roles.push({department, role: c.role});
            if (department) covered.add(department);
        }
        // Any typed department without its own role becomes a plain "Member".
        for (const d of explicitDepts) if (!covered.has(d)) roles.push({department: d, role: "Member"});

        mandates.push({academicYear, roles, raw});
    }
    return {mandates, warnings};
}

/* ── Buddy / newbies ────────────────────────────────────────────── */

/** Splits the "My newbies" cell into individual names (newline or comma). */
export function parseNames(text: string): string[] {
    return text
        .split(/\r?\n|,/)
        .map((n) => n.trim())
        .filter(Boolean);
}

/* ── Photos ─────────────────────────────────────────────────────── */

/** True if the submission provided any photo (upload or alternative link). */
export function drivePhotoPresent(uploadCell: string, altCell: string): boolean {
    return Boolean(uploadCell.trim() || altCell.trim());
}

/* ── Internal ───────────────────────────────────────────────────── */

function splitLines(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
}
