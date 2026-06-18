"use client";

import {useMemo, useRef, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {AlertTriangle, Camera} from "lucide-react";
import {Button} from "@/components/ui/Button";
import {Checkbox} from "@/components/ui/Checkbox";
import {Badge} from "@/components/ui/Badge";
import {Combobox} from "@/components/ui/Combobox";
import {STATUS_LABELS} from "@/lib/utils";
import {pairKey, zipPairs} from "@/lib/import/parse";
import {
    applyMemberImport,
    previewMemberImport,
    type ImportPreview,
    type ImportResult,
    type ImportSelection,
    type MemberLite,
    type PreviewStatus,
    type RowPreview,
    type ScalarField,
} from "@/actions/import";

const SCALAR_LABELS: Record<ScalarField, string> = {
    fullName: "Name",
    bio: "Bio",
    favouriteMemory: "Favourite memory",
    linkedinUrl: "LinkedIn",
    joinedAt: "Join date",
};
const SCALAR_ORDER: ScalarField[] = ["fullName", "bio", "favouriteMemory", "linkedinUrl", "joinedAt"];

const NEW = "__new__";
const SKIP = "__skip__";
const NONE = "__none__";
const BYNAME = "__byname__";

type ScalarDiff = { field: ScalarField; current: string | null; incoming: string };

type RowState = {
    targetId: string; // NEW | SKIP | member id
    fieldChecks: Partial<Record<ScalarField, boolean>>;
    status: boolean;
    mandates: boolean[][]; // [mandate][role]
    buddyId: string; // NONE | BYNAME | member id
    newbieIds: string[]; // per newbie: NONE | BYNAME | member id
};

function initRowState(row: RowPreview): RowState {
    return {
        targetId: row.autoTargetId ?? NEW,
        fieldChecks: {},
        status: !row.autoTargetId && row.statusHistory.length > 0,
        mandates: row.mandates.map((m) => m.roles.map(() => false)),
        buddyId: row.buddy ? (row.buddy.autoId ?? (row.buddy.pending ? BYNAME : NONE)) : NONE,
        newbieIds: row.newbies.map((n) => n.autoId ?? (n.pending ? BYNAME : NONE)),
    };
}

function WarningLine({children, className = ""}: {children: React.ReactNode; className?: string}) {
    return (
        <span className={`flex items-start gap-1 text-amber-600 ${className}`}>
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0"/>
            <span className="min-w-0">{children}</span>
        </span>
    );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtMonth(iso: string): string {
    const [y, m] = iso.split("-");
    return `${MONTHS[(Number(m) || 1) - 1]} ${y}`;
}
const statusKey = (e: PreviewStatus) => `${e.status}@${e.startedAt.slice(0, 7)}`;

/** One status chain, dimming entries shared with the other side and marking the rest. */
function StatusChain({entries, otherKeys, role}: {entries: PreviewStatus[]; otherKeys: Set<string>; role: "current" | "incoming"}) {
    if (entries.length === 0) return <span className="text-[var(--text-4)]">—</span>;
    return (
        <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
            {entries.map((e, i) => {
                const shared = otherKeys.has(statusKey(e));
                const cls = shared
                    ? "text-[var(--text-3)]"
                    : role === "current"
                        ? "text-amber-600 line-through"
                        : "text-[var(--accent)] font-semibold";
                return (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className="text-[var(--text-4)]">→</span>}
                        <span className={cls}>
                            {STATUS_LABELS[e.status]} <span className="text-[10px] opacity-70">{fmtMonth(e.startedAt)}</span>
                        </span>
                    </span>
                );
            })}
        </span>
    );
}

/** Current-vs-sheet status journey with differences highlighted, plus the replace toggle. */
function StatusJourney({current, incoming, checked, onChange}: {
    current: PreviewStatus[];
    incoming: PreviewStatus[];
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    const curKeys = new Set(current.map(statusKey));
    const incKeys = new Set(incoming.map(statusKey));
    const identical =
        current.length === incoming.length && current.every((e) => incKeys.has(statusKey(e)));

    return (
        <Section title="Status journey">
            <div className="space-y-1 text-[12px]">
                <div className="flex gap-2">
                    <span className="text-[var(--text-4)] w-[68px] shrink-0">On site</span>
                    <StatusChain entries={current} otherKeys={incKeys} role="current"/>
                </div>
                <div className="flex gap-2">
                    <span className="text-[var(--text-4)] w-[68px] shrink-0">From sheet</span>
                    <StatusChain entries={incoming} otherKeys={curKeys} role="incoming"/>
                </div>
            </div>
            {incoming.length === 0 ? (
                <p className="text-[11px] text-[var(--text-3)] mt-1">No status journey in the sheet to apply.</p>
            ) : identical ? (
                <p className="text-[11px] text-[var(--text-3)] mt-1">Identical — nothing to change.</p>
            ) : (
                <CheckRow checked={checked} onChange={onChange}>
                    <span className="font-medium text-[var(--text-2)]">Replace the on-site journey with the sheet&rsquo;s version</span>
                </CheckRow>
            )}
        </Section>
    );
}

/** Compares URLs ignoring scheme, a leading "www.", and a trailing slash. */
function sameUrl(a: string, b: string): boolean {
    const norm = (u: string) =>
        u.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
    return norm(a) === norm(b);
}

function diffsFor(incoming: RowPreview["incoming"], target: MemberLite | undefined): ScalarDiff[] {
    if (!target) return [];
    const cur: Record<ScalarField, string | null> = {
        fullName: target.fullName,
        bio: target.bio,
        favouriteMemory: target.favouriteMemory,
        linkedinUrl: target.linkedinUrl,
        joinedAt: target.joinedAt,
    };
    const inc: Record<ScalarField, string | null> = {
        fullName: incoming.fullName,
        bio: incoming.bio,
        favouriteMemory: incoming.favouriteMemory,
        linkedinUrl: incoming.linkedinUrl,
        joinedAt: incoming.joinedAt,
    };
    const out: ScalarDiff[] = [];
    for (const f of SCALAR_ORDER) {
        const i = (inc[f] ?? "").trim();
        if (!i) continue;
        const c = (cur[f] ?? "").trim();
        // URLs: ignore scheme/"www."/trailing-slash differences (e.g. linkedin.com vs https://www.linkedin.com/).
        const unchanged = f === "linkedinUrl" ? sameUrl(c, i) : c === i;
        if (!unchanged) out.push({field: f, current: cur[f], incoming: i});
    }
    return out;
}

export function MemberImportClient() {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState("");
    const [preview, setPreview] = useState<ImportPreview | null>(null);
    const [states, setStates] = useState<RowState[]>([]);
    const [error, setError] = useState("");
    const [result, setResult] = useState<ImportResult | null>(null);
    const [pending, startTransition] = useTransition();

    function reset() {
        setPreview(null);
        setStates([]);
        setError("");
        setResult(null);
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
    }

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setError("");
        setResult(null);
        const formData = new FormData();
        formData.append("file", file);
        startTransition(async () => {
            const res = await previewMemberImport(formData);
            if (!res.success) {
                setError(res.error);
                setPreview(null);
                return;
            }
            setPreview(res.data);
            setStates(res.data.rows.map(initRowState));
        });
    }

    function patchRow(i: number, patch: Partial<RowState>) {
        setStates((prev) => prev.map((s, j) => (j === i ? {...s, ...patch} : s)));
    }

    function buildSelections(): ImportSelection[] {
        if (!preview) return [];
        const out: ImportSelection[] = [];
        preview.rows.forEach((row, i) => {
            const st = states[i];
            if (st.targetId === SKIP) return;
            const isCreate = st.targetId === NEW;
            const target = row.candidates.find((c) => c.id === st.targetId);

            const fields: Partial<Record<ScalarField, string>> = {};
            if (isCreate) {
                fields.fullName = row.incoming.fullName;
                if (row.incoming.bio) fields.bio = row.incoming.bio;
                if (row.incoming.favouriteMemory) fields.favouriteMemory = row.incoming.favouriteMemory;
                if (row.incoming.linkedinUrl) fields.linkedinUrl = row.incoming.linkedinUrl;
                if (row.incoming.joinedAt) fields.joinedAt = row.incoming.joinedAt;
            } else {
                for (const d of diffsFor(row.incoming, target)) {
                    if (st.fieldChecks[d.field] ?? true) fields[d.field] = d.incoming;
                }
            }

            const personSel = (name: string, choice: string) =>
                choice === NONE ? undefined : {name, memberId: choice === BYNAME ? null : choice};

            out.push({
                fullName: row.incoming.fullName,
                action: isCreate ? "create" : "update",
                memberId: isCreate ? null : st.targetId,
                fields,
                statusHistory: st.status && row.statusHistory.length ? row.statusHistory : undefined,
                mandates: row.mandates
                    .map((m, mi) => {
                        if (!m.mandateId) return null;
                        const picked = m.roles.filter((_, ri) => st.mandates[mi]?.[ri]);
                        if (picked.length === 0) return null;
                        return {
                            mandateId: m.mandateId,
                            departments: picked.map((p) => p.department ?? ""),
                            roleTitles: picked.map((p) => p.role),
                        };
                    })
                    .filter((x): x is {mandateId: string; departments: string[]; roleTitles: string[]} => x !== null),
                buddy: row.buddy ? personSel(row.buddy.name, st.buddyId) ?? null : null,
                newbies: row.newbies
                    .map((n, ni) => personSel(n.name, st.newbieIds[ni]))
                    .filter((x): x is {name: string; memberId: string | null} => Boolean(x)),
            });
        });
        return out;
    }

    function handleImport() {
        if (!preview) return;
        const blocked = preview.rows
            .filter((r, i) => states[i].targetId === NEW && !r.incoming.joinedAt)
            .map((r) => r.fullName);
        if (blocked.length > 0) {
            setError(`Set a join month before importing as new: ${blocked.join(", ")}. Match them to an existing member or add manually.`);
            return;
        }
        const selections = buildSelections();
        if (selections.length === 0) {
            setError("Nothing selected to import.");
            return;
        }
        setError("");
        startTransition(async () => {
            const res = await applyMemberImport(selections);
            if (!res.success) {
                setError(res.error);
                return;
            }
            setResult(res.data);
            router.refresh();
        });
    }

    function setAllSkipped(skip: boolean) {
        if (!preview) return;
        setStates((prev) =>
            prev.map((s, j) =>
                skip
                    ? {...s, targetId: SKIP}
                    : s.targetId === SKIP
                        ? {...s, targetId: preview.rows[j].autoTargetId ?? NEW}
                        : s
            )
        );
    }

    const includedCount = states.filter((s) => s.targetId !== SKIP).length;

    /* ── Upload step ─────────────────────────────────────────────── */
    if (!preview) {
        return (
            <div className="max-w-xl">
                <label className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-6 py-10 text-center cursor-pointer hover:border-[var(--accent)] transition-colors">
                    <span className="text-[14px] font-semibold text-[var(--text-1)]">
                        {pending ? "Reading spreadsheet…" : "Choose .xlsx file"}
                    </span>
                    <span className="text-[12px] text-[var(--text-3)]">{fileName || "Google Forms responses export"}</span>
                    <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFile} disabled={pending} className="hidden"/>
                </label>
                {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
            </div>
        );
    }

    /* ── Result step ─────────────────────────────────────────────── */
    if (result) {
        return (
            <div className="max-w-xl">
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6">
                    <p className="text-[15px] font-bold text-[var(--text-1)] mb-2">Import complete</p>
                    <p className="text-[13px] text-[var(--text-2)]">
                        Created <strong>{result.created}</strong>, updated <strong>{result.updated}</strong>.
                    </p>
                    {result.linkWarnings.length > 0 && (
                        <ul className="mt-3 space-y-1">
                            {result.linkWarnings.map((w, i) => (
                                <li key={i}><WarningLine className="text-[12px]">{w}</WarningLine></li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-5 flex gap-2">
                        <Button size="sm" onClick={() => router.push("/admin/members")}>Back to members</Button>
                        <Button size="sm" variant="secondary" onClick={reset}>Import another file</Button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Preview step ────────────────────────────────────────────── */
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <p className="text-[13px] text-[var(--text-3)]">
                    {fileName} · <strong className="text-[var(--text-1)]">{preview.newCount}</strong> new,{" "}
                    <strong className="text-[var(--text-1)]">{preview.existingCount}</strong> matched
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setAllSkipped(false)}>Select all</Button>
                    <Button size="sm" variant="ghost" onClick={() => setAllSkipped(true)}>Unselect all</Button>
                    <Button size="sm" variant="ghost" onClick={() => setStates(preview.rows.map(initRowState))}>Reset choices</Button>
                    <Button size="sm" variant="secondary" onClick={reset}>Cancel</Button>
                    <Button size="sm" onClick={handleImport} disabled={pending || includedCount === 0}>
                        {pending ? "Importing…" : `Import ${includedCount} row${includedCount !== 1 ? "s" : ""}`}
                    </Button>
                </div>
            </div>

            {error && <p className="mb-4 text-[13px] text-red-600">{error}</p>}

            <div className="flex flex-col gap-3">
                {preview.rows.map((row, i) => (
                    <RowCard key={row.rowIndex} row={row} state={states[i]} onPatch={(p) => patchRow(i, p)}/>
                ))}
            </div>
        </div>
    );
}

/* ── Row card ───────────────────────────────────────────────────── */

function personOptions(person: {pending: boolean; candidates: {id: string; fullName: string}[]}) {
    const opts = [{value: NONE, label: "— don't link —"}];
    if (person.pending) opts.push({value: BYNAME, label: "Link after import (this file)"});
    for (const c of person.candidates) opts.push({value: c.id, label: c.fullName});
    return opts;
}

function RowCard({row, state, onPatch}: {
    row: RowPreview;
    state: RowState;
    onPatch: (patch: Partial<RowState>) => void;
}) {
    const skipped = state.targetId === SKIP;
    const isCreate = state.targetId === NEW;
    const target = useMemo(() => row.candidates.find((c) => c.id === state.targetId), [row.candidates, state.targetId]);
    const diffs = useMemo(() => diffsFor(row.incoming, target), [row.incoming, target]);

    const targetOptions = [
        {value: NEW, label: "Create as new member"},
        {value: SKIP, label: "Skip this row"},
        ...row.candidates.map((c) => ({value: c.id, label: c.fullName})),
    ];

    const allWarnings = [...row.warnings, ...row.statusWarnings, ...row.mandateWarnings];
    const dupNudge = isCreate && row.candidates.length > 0;

    return (
        <div className={`rounded-[var(--radius-lg)] border border-[var(--border)] p-4 ${skipped ? "bg-[var(--surface-raised)]" : "bg-[var(--surface)]"}`}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[14px] font-semibold ${skipped ? "text-[var(--text-4)]" : "text-[var(--text-1)]"}`}>{row.fullName}</span>
                {skipped ? (
                    <Badge variant="outline">Skipped</Badge>
                ) : isCreate ? (
                    <Badge>New</Badge>
                ) : (
                    <Badge variant="accent">{row.autoIsFuzzy && state.targetId === row.autoTargetId ? "Suggested match" : "Update"}</Badge>
                )}
                {row.hasPhoto && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-3)]">
                        <Camera className="w-3 h-3"/> photo provided — upload manually
                    </span>
                )}
            </div>

            {/* Target picker */}
            <div className="mb-3 max-w-sm">
                <Combobox
                    value={state.targetId}
                    onValueChange={(v) => onPatch({targetId: v})}
                    options={targetOptions}
                    placeholder="Match to a member or create new"
                />
                {dupNudge && (
                    <WarningLine className="mt-1 text-[11px]">
                        Similar existing members found — pick one above if this is the same person, to avoid a duplicate.
                    </WarningLine>
                )}
            </div>

            {!skipped && (
                <div className="space-y-3">
                    {/* Scalar fields */}
                    {isCreate ? (
                        <p className="text-[12px] text-[var(--text-2)]">
                            Joins <strong>{row.incoming.joinedAt ?? "— (set a join month first)"}</strong>
                            {row.incoming.linkedinUrl && " · LinkedIn"}
                            {row.incoming.bio && " · bio"}
                            {row.incoming.favouriteMemory && " · memory"}
                        </p>
                    ) : diffs.length > 0 ? (
                        <Section title="Changed fields">
                            {diffs.map((d) => (
                                <CheckRow
                                    key={d.field}
                                    checked={state.fieldChecks[d.field] ?? true}
                                    onChange={(v) => onPatch({fieldChecks: {...state.fieldChecks, [d.field]: v}})}
                                >
                                    <span className="font-medium text-[var(--text-2)]">{SCALAR_LABELS[d.field]}:</span>{" "}
                                    <span className="text-[var(--text-4)] line-through">{d.current || "—"}</span>{" "}
                                    <span className="text-[var(--text-3)]">→</span>{" "}
                                    <span className="text-[var(--text-1)]">{d.incoming}</span>
                                </CheckRow>
                            ))}
                        </Section>
                    ) : (
                        <p className="text-[12px] text-[var(--text-3)]">No field differences with this member.</p>
                    )}

                    {/* Status journey */}
                    {isCreate
                        ? row.statusHistory.length > 0 && (
                            <CheckRow checked={state.status} onChange={(v) => onPatch({status: v})}>
                                <span className="font-medium text-[var(--text-2)]">Status journey</span>{" "}
                                <span className="text-[var(--text-3)]">({row.statusHistory.map((s) => STATUS_LABELS[s.status]).join(" → ")})</span>
                            </CheckRow>
                        )
                        : target && (row.statusHistory.length > 0 || target.statusHistory.length > 0) && (
                            <StatusJourney
                                current={target.statusHistory}
                                incoming={row.statusHistory}
                                checked={state.status}
                                onChange={(v) => onPatch({status: v})}
                            />
                        )}

                    {/* Mandates — one checkable entry per department + role pair */}
                    {row.mandates.length > 0 && (
                        <Section title="Mandate roles (best-effort — review)">
                            {row.mandates.map((m, mi) => {
                                const existing = m.mandateId
                                    ? target?.memberships.find((mm) => mm.mandateId === m.mandateId)
                                    : undefined;
                                const existingPairs = existing ? zipPairs(existing.departments, existing.roleTitles) : [];
                                const existingKeys = new Set(existingPairs.map((p) => pairKey(p.department, p.role)));
                                return (
                                    <div key={mi} className="space-y-1">
                                        <p className="text-[11px] text-[var(--text-3)]">
                                            {m.academicYear}
                                            {!m.mandateId && <span className="text-amber-600"> — no mandate for this year</span>}
                                        </p>
                                        {existingPairs.length > 0 && (
                                            <p className="text-[11px] text-[var(--text-4)] pl-1">
                                                On site: {existingPairs.map((p) => `${p.department || "—"} · ${p.role}`).join(", ")}
                                            </p>
                                        )}
                                        {m.roles.length === 0 && <p className="text-[11px] text-[var(--text-4)] pl-1">{m.raw}</p>}
                                        {m.roles.map((pair, ri) => {
                                            const already = existingKeys.has(pairKey(pair.department, pair.role));
                                            return (
                                                <CheckRow
                                                    key={ri}
                                                    disabled={!m.mandateId || already}
                                                    checked={(state.mandates[mi]?.[ri] ?? false) && !already}
                                                    onChange={(v) =>
                                                        onPatch({
                                                            mandates: state.mandates.map((arr, j) =>
                                                                j === mi ? arr.map((x, k) => (k === ri ? v : x)) : arr
                                                            ),
                                                        })
                                                    }
                                                >
                                                    <span className="font-medium text-[var(--text-2)]">{pair.department || "—"}</span>
                                                    <span className="text-[var(--text-3)]"> · </span>
                                                    <span className="text-[var(--text-1)]">{pair.role}</span>
                                                    {already && <span className="text-[var(--text-4)]"> — already added</span>}
                                                </CheckRow>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </Section>
                    )}

                    {/* Buddy / newbies */}
                    {(row.buddy || row.newbies.length > 0) && (
                        <Section title="Buddy links">
                            {row.buddy && (
                                <PersonRow
                                    label="Buddy"
                                    person={row.buddy}
                                    value={state.buddyId}
                                    onChange={(v) => onPatch({buddyId: v})}
                                />
                            )}
                            {row.newbies.map((n, ni) => (
                                <PersonRow
                                    key={ni}
                                    label="Newbie"
                                    person={n}
                                    value={state.newbieIds[ni]}
                                    onChange={(v) => onPatch({newbieIds: state.newbieIds.map((x, j) => (j === ni ? v : x))})}
                                />
                            ))}
                        </Section>
                    )}

                    {allWarnings.length > 0 && (
                        <ul className="space-y-0.5">
                            {allWarnings.map((w, wi) => (
                                <li key={wi}><WarningLine className="text-[11px]">{w}</WarningLine></li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

function PersonRow({label, person, value, onChange}: {
    label: string;
    person: {name: string; autoId: string | null; pending: boolean; candidates: {id: string; fullName: string}[]};
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-[var(--text-3)] w-12 shrink-0">{label}</span>
            <span className="font-medium text-[var(--text-1)]">{person.name}</span>
            {!person.autoId && !person.pending && person.candidates.length === 0 && (
                <span className="text-amber-600">not found</span>
            )}
            <div className="min-w-[200px] flex-1">
                <Combobox value={value} onValueChange={onChange} options={personOptions(person)} placeholder="— don't link —"/>
            </div>
        </div>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
    return (
        <div>
            <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] mb-1.5">{title}</p>
            <div className="space-y-1.5">{children}</div>
        </div>
    );
}

function CheckRow({checked, onChange, disabled, children}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="flex items-start gap-2 text-[12px] leading-snug cursor-pointer" style={{opacity: disabled ? 0.5 : 1}}>
            <span className="pt-0.5"><Checkbox checked={checked} onCheckedChange={onChange} disabled={disabled}/></span>
            <span className="min-w-0">{children}</span>
        </label>
    );
}
