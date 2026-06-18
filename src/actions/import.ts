"use server";

import * as XLSX from "xlsx";
import {prisma} from "@/lib/prisma";
import {actionError, requireAuth} from "@/lib/auth";
import {ValidationError} from "@/lib/validation";
import {ActionResult} from "@/types";
import {MemberStatus} from "@/generated/prisma/enums";
import {
    createMember,
    setStatusHistory,
    updateMember,
    type MemberFormData,
    type MemberUpdateData,
} from "@/actions/members";
import {
    canonicalAcademicYear,
    drivePhotoPresent,
    type ImportColumn,
    type MandateRole,
    nameMatchScore,
    normalizeName,
    parseJoinMonth,
    parseMandates,
    pairKey,
    parseNames,
    parseStatusHistory,
    resolveColumns,
    zipPairs,
} from "@/lib/import/parse";

/* ── Preview types (shared with the client) ─────────────────────── */

export type ScalarField = "fullName" | "bio" | "favouriteMemory" | "linkedinUrl" | "joinedAt";

export type PreviewStatus = { status: MemberStatus; startedAt: string };
export type MembershipLite = { mandateId: string; departments: string[]; roleTitles: string[] };

/** An existing member with the fields we diff (joinedAt as YYYY-MM-DD). */
export type MemberLite = {
    id: string;
    fullName: string;
    bio: string | null;
    favouriteMemory: string | null;
    linkedinUrl: string | null;
    joinedAt: string;
    statusHistory: PreviewStatus[];
    memberships: MembershipLite[];
};
export type PreviewMandate = {
    academicYear: string;
    mandateId: string | null;
    roles: MandateRole[];
    raw: string;
};
export type PreviewPerson = {
    name: string;
    autoId: string | null;
    pending: boolean; // name matches another row being imported (link after creation)
    candidates: { id: string; fullName: string }[];
};

export type RowPreview = {
    rowIndex: number;
    fullName: string;
    incoming: {
        fullName: string;
        bio: string;
        favouriteMemory: string;
        linkedinUrl: string;
        joinedAt: string | null;
    };
    exactMatchId: string | null;
    ambiguous: boolean;
    /** Best-guess existing member (exact or confident fuzzy); null → create new. */
    autoTargetId: string | null;
    autoIsFuzzy: boolean;
    /** Ranked existing members for the manual picker. */
    candidates: MemberLite[];
    statusHistory: PreviewStatus[];
    statusWarnings: string[];
    mandates: PreviewMandate[];
    mandateWarnings: string[];
    buddy: PreviewPerson | null;
    newbies: PreviewPerson[];
    hasPhoto: boolean;
    warnings: string[];
};

export type ImportPreview = { rows: RowPreview[]; existingCount: number; newCount: number };

const MAX_BYTES = 5 * 1024 * 1024;
const CONFIDENT_SCORE = 5; // subset + at least one shared token

/* ── Preview ────────────────────────────────────────────────────── */

export async function previewMemberImport(
    formData: FormData
): Promise<ActionResult<ImportPreview>> {
    try {
        await requireAuth();

        const file = formData.get("file");
        if (!(file instanceof File)) return {success: false, error: "No file uploaded."};
        if (!file.name.toLowerCase().endsWith(".xlsx"))
            return {success: false, error: "Please upload an .xlsx file."};
        if (file.size > MAX_BYTES) return {success: false, error: "File too large (max 5 MB)."};

        const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), {type: "buffer"});
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) return {success: false, error: "The spreadsheet has no sheets."};

        const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {header: 1, defval: ""});
        if (grid.length < 2) return {success: false, error: "The spreadsheet has no data rows."};

        const cols = resolveColumns(grid[0]);
        if (cols.fullName === undefined)
            return {success: false, error: "Couldn't find a 'Full name' column in the sheet."};
        const cell = (row: unknown[], k: ImportColumn) => String(row[cols[k] ?? -1] ?? "").trim();

        const members = await prisma.member.findMany({
            select: {
                id: true, fullName: true, bio: true, favouriteMemory: true, linkedinUrl: true, joinedAt: true,
                statusHistory: {select: {status: true, startedAt: true}, orderBy: {startedAt: "asc"}},
                mandateMemberships: {select: {mandateId: true, departments: true, roleTitles: true}},
            },
        });
        const toLite = (m: (typeof members)[number]): MemberLite => ({
            id: m.id,
            fullName: m.fullName,
            bio: m.bio,
            favouriteMemory: m.favouriteMemory,
            linkedinUrl: m.linkedinUrl,
            joinedAt: m.joinedAt.toISOString().slice(0, 10),
            statusHistory: m.statusHistory.map((s) => ({status: s.status, startedAt: s.startedAt.toISOString().slice(0, 10)})),
            memberships: m.mandateMemberships.map((mm) => ({mandateId: mm.mandateId, departments: mm.departments, roleTitles: mm.roleTitles})),
        });

        const byName = new Map<string, typeof members>();
        for (const m of members) {
            const key = normalizeName(m.fullName);
            (byName.get(key) ?? byName.set(key, []).get(key)!).push(m);
        }

        // Ranked fuzzy candidates for a name (best first).
        const candidatesFor = (name: string, limit = 6) =>
            members
                .map((m) => ({lite: toLite(m), score: nameMatchScore(name, m.fullName)}))
                .filter((x) => x.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);

        const mandates = await prisma.mandate.findMany({select: {id: true, academicYear: true}});
        const mandateByYear = new Map(mandates.map((m) => [canonicalAcademicYear(m.academicYear), m.id]));

        const dataRows = grid.slice(1).filter((r) => cell(r, "fullName"));
        const incomingNames = new Set(dataRows.map((r) => normalizeName(cell(r, "fullName"))));

        const resolvePerson = (name: string): PreviewPerson => {
            const exact = byName.get(normalizeName(name)) ?? [];
            const scored = candidatesFor(name);
            let autoId: string | null = null;
            if (exact.length === 1) autoId = exact[0].id;
            else if (exact.length === 0) {
                const top = scored[0];
                if (top && top.score >= CONFIDENT_SCORE && (scored.length === 1 || scored[1].score < top.score))
                    autoId = top.lite.id;
            }
            return {
                name,
                autoId,
                pending: autoId === null && incomingNames.has(normalizeName(name)),
                candidates: scored.map((s) => ({id: s.lite.id, fullName: s.lite.fullName})),
            };
        };

        const rows: RowPreview[] = dataRows.map((r, rowIndex) => {
            const fullName = cell(r, "fullName");
            const exact = byName.get(normalizeName(fullName)) ?? [];
            const exactMatchId = exact.length === 1 ? exact[0].id : null;
            const ambiguous = exact.length > 1;

            const scored = candidatesFor(fullName);
            const candidates = scored.map((s) => s.lite);

            let autoTargetId: string | null = exactMatchId;
            let autoIsFuzzy = false;
            if (!autoTargetId && !ambiguous) {
                const top = scored[0];
                if (top && top.score >= CONFIDENT_SCORE && (scored.length === 1 || scored[1].score < top.score)) {
                    autoTargetId = top.lite.id;
                    autoIsFuzzy = true;
                }
            }

            const joinRaw = cell(r, "joinMonth");
            const joinedAt = parseJoinMonth(joinRaw);

            const warnings: string[] = [];
            if (ambiguous)
                warnings.push(`${exact.length} existing members share this exact name — pick the right one.`);
            if (!joinedAt) warnings.push(joinRaw ? `Couldn't parse join month "${joinRaw}".` : "No join month provided.");

            const sh = parseStatusHistory(cell(r, "statusHistory"));
            const md = parseMandates(cell(r, "mandates"));
            const mandatesResolved: PreviewMandate[] = md.mandates.map((m) => ({
                ...m,
                mandateId: mandateByYear.get(canonicalAcademicYear(m.academicYear)) ?? null,
            }));
            const mandateWarnings = md.warnings.map((w) => `Couldn't parse mandate line: "${w}"`);
            for (const m of mandatesResolved)
                if (!m.mandateId)
                    mandateWarnings.push(`No mandate found for ${m.academicYear} — create it first to attach roles.`);

            const buddyName = cell(r, "buddy");
            const buddy = buddyName ? resolvePerson(buddyName) : null;
            const newbies = parseNames(cell(r, "newbies")).map(resolvePerson);

            return {
                rowIndex,
                fullName,
                incoming: {
                    fullName,
                    bio: cell(r, "bio"),
                    favouriteMemory: cell(r, "favouriteMemory"),
                    linkedinUrl: cell(r, "linkedinUrl"),
                    joinedAt,
                },
                exactMatchId,
                ambiguous,
                autoTargetId,
                autoIsFuzzy,
                candidates,
                statusHistory: sh.entries,
                statusWarnings: sh.warnings.map((w) => `Couldn't parse status line: "${w}"`),
                mandates: mandatesResolved,
                mandateWarnings,
                buddy,
                newbies,
                hasPhoto: drivePhotoPresent(cell(r, "photoUpload"), cell(r, "altPhoto")),
                warnings,
            };
        });

        return {
            success: true,
            data: {
                rows,
                existingCount: rows.filter((r) => r.autoTargetId).length,
                newCount: rows.filter((r) => !r.autoTargetId).length,
            },
        };
    } catch (e) {
        return actionError(e);
    }
}

/* ── Apply ──────────────────────────────────────────────────────── */

export type ImportSelection = {
    fullName: string;
    action: "create" | "update";
    memberId?: string | null;
    fields: Partial<Record<ScalarField, string>>;
    statusHistory?: PreviewStatus[];
    mandates?: { mandateId: string; departments: string[]; roleTitles: string[] }[];
    /** memberId set → use it; null → resolve by name after pass 1 (for imported buddies). */
    buddy?: { name: string; memberId: string | null } | null;
    newbies?: { name: string; memberId: string | null }[];
};

export type ImportResult = { created: number; updated: number; linkWarnings: string[] };

export async function applyMemberImport(
    selections: ImportSelection[]
): Promise<ActionResult<ImportResult>> {
    try {
        await requireAuth();

        let created = 0;
        let updated = 0;
        const linkWarnings: string[] = [];

        const nameToId = new Map<string, string>();
        const existing = await prisma.member.findMany({select: {id: true, fullName: true}});
        for (const m of existing) {
            const key = normalizeName(m.fullName);
            if (!nameToId.has(key)) nameToId.set(key, m.id);
        }

        const resolved: { sel: ImportSelection; memberId: string }[] = [];

        // Pass 1 — create / update scalar fields + status history.
        for (const sel of selections) {
            if (sel.action === "create") {
                const joinedAt = sel.fields.joinedAt ?? null;
                if (!joinedAt)
                    throw new ValidationError(`"${sel.fullName}" has no valid join month; fix it before importing.`);
                const data: MemberFormData = {
                    fullName: sel.fullName,
                    bio: sel.fields.bio,
                    favouriteMemory: sel.fields.favouriteMemory,
                    linkedinUrl: sel.fields.linkedinUrl,
                    joinedAt,
                    statusHistory: sel.statusHistory?.length
                        ? sel.statusHistory
                        : [{status: "NEWBIE", startedAt: joinedAt}],
                };
                const res = await createMember(data);
                if (!res.success) throw new Error(`Creating "${sel.fullName}": ${res.error}`);
                nameToId.set(normalizeName(sel.fullName), res.data.id);
                resolved.push({sel, memberId: res.data.id});
                created++;
            } else {
                if (!sel.memberId) throw new Error(`Missing member id for "${sel.fullName}".`);
                const scalar: MemberUpdateData = {};
                for (const f of ["fullName", "bio", "favouriteMemory", "linkedinUrl", "joinedAt"] as ScalarField[]) {
                    if (sel.fields[f] !== undefined) scalar[f] = sel.fields[f];
                }
                if (Object.keys(scalar).length) {
                    const r = await updateMember(sel.memberId, scalar);
                    if (!r.success) throw new Error(`Updating "${sel.fullName}": ${r.error}`);
                }
                if (sel.statusHistory) {
                    const r = await setStatusHistory(sel.memberId, sel.statusHistory);
                    if (!r.success) throw new Error(`Status history for "${sel.fullName}": ${r.error}`);
                }
                resolved.push({sel, memberId: sel.memberId});
                updated++;
            }
        }

        // Pass 2 — mandates and buddy links (all member ids now known).
        for (const {sel, memberId} of resolved) {
            for (const m of sel.mandates ?? []) {
                const existingMs = await prisma.mandateMembership.findFirst({
                    where: {memberId, mandateId: m.mandateId},
                    select: {id: true, departments: true, roleTitles: true},
                });
                if (existingMs) {
                    // Merge — keep what's already on the membership, append only new pairs.
                    const pairs = zipPairs(existingMs.departments, existingMs.roleTitles);
                    const seen = new Set(pairs.map((p) => pairKey(p.department, p.role)));
                    m.departments.forEach((d, i) => {
                        const role = m.roleTitles[i] ?? "";
                        if (!seen.has(pairKey(d, role))) {
                            seen.add(pairKey(d, role));
                            pairs.push({department: d, role});
                        }
                    });
                    await prisma.mandateMembership.update({
                        where: {id: existingMs.id},
                        data: {departments: pairs.map((p) => p.department), roleTitles: pairs.map((p) => p.role)},
                    });
                } else {
                    await prisma.mandateMembership.create({
                        data: {memberId, mandateId: m.mandateId, departments: m.departments, roleTitles: m.roleTitles},
                    });
                }
            }

            if (sel.buddy) {
                const buddyId = sel.buddy.memberId ?? nameToId.get(normalizeName(sel.buddy.name)) ?? null;
                if (!buddyId) linkWarnings.push(`Buddy "${sel.buddy.name}" for ${sel.fullName} not found — skipped.`);
                else await linkBuddy(buddyId, memberId, sel.fullName, sel.buddy.name, linkWarnings);
            }
            for (const nb of sel.newbies ?? []) {
                const newbieId = nb.memberId ?? nameToId.get(normalizeName(nb.name)) ?? null;
                if (!newbieId) linkWarnings.push(`Newbie "${nb.name}" for ${sel.fullName} not found — skipped.`);
                else await linkBuddy(memberId, newbieId, sel.fullName, nb.name, linkWarnings);
            }
        }

        return {success: true, data: {created, updated, linkWarnings}};
    } catch (e) {
        return actionError(e);
    }
}

/** Idempotently link a buddy→newbie pair, collecting (not throwing) conflicts. */
async function linkBuddy(
    buddyId: string,
    newbieId: string,
    buddyLabel: string,
    newbieLabel: string,
    warnings: string[]
): Promise<void> {
    if (buddyId === newbieId) {
        warnings.push(`"${buddyLabel}" can't be their own buddy — skipped.`);
        return;
    }
    const existing = await prisma.buddyLink.findFirst({where: {newbieId}});
    if (existing) {
        if (existing.buddyId !== buddyId)
            warnings.push(`"${newbieLabel}" already has a different buddy — left unchanged.`);
        return;
    }
    await prisma.buddyLink.create({data: {buddyId, newbieId}});
}
