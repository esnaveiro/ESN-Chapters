"use client";

import {useMemo, useState, useTransition} from "react";
import Link from "next/link";
import Image from "next/image";
import {Search} from "lucide-react";
import {MemberStatus} from "@/generated/prisma/enums";
import {StatusBadge} from "@/components/ui/Badge";
import {STATUS_LABELS} from "@/lib/utils";
import {deleteMembers} from "@/actions/members";
import {Checkbox} from "@/components/ui/Checkbox";

type Member = {
    id: string;
    fullName: string;
    slug: string;
    joinedAt: Date;
    photoUrl: string | null;
    statusHistory: { status: MemberStatus; endedAt: Date | null }[];
};

const ALL_STATUSES = Object.values(MemberStatus);

export function MembersRoster({members}: { members: Member[] }) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<MemberStatus | "ALL">("ALL");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    const counts = useMemo(() => {
        const c: Record<string, number> = {ALL: members.length};
        for (const s of ALL_STATUSES) c[s] = 0;
        for (const m of members) {
            const s = m.statusHistory[0]?.status ?? "NEWBIE";
            c[s] = (c[s] ?? 0) + 1;
        }
        return c;
    }, [members]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return members.filter((m) => {
            const s = m.statusHistory[0]?.status ?? "NEWBIE";
            return (
                (statusFilter === "ALL" || s === statusFilter) &&
                (!q || m.fullName.toLowerCase().includes(q))
            );
        });
    }, [members, query, statusFilter]);

    const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
    const someFilteredSelected = filtered.some((m) => selected.has(m.id));

    function toggleAll() {
        if (allFilteredSelected) {
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((m) => next.delete(m.id));
                return next;
            });
        } else {
            setSelected((prev) => {
                const next = new Set(prev);
                filtered.forEach((m) => next.add(m.id));
                return next;
            });
        }
        setConfirmDelete(false);
    }

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
        setConfirmDelete(false);
    }

    function handleBulkDelete() {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        startTransition(async () => {
            await deleteMembers([...selected]);
            setSelected(new Set());
            setConfirmDelete(false);
        });
    }

    return (
        <div>
            {/* Status filter + search */}
            <div className="flex flex-wrap items-center gap-3 mb-7">
                <div className="flex flex-wrap gap-1.5">
                    {[{key: "ALL" as const, label: "All"}, ...ALL_STATUSES.map((s) => ({
                        key: s,
                        label: STATUS_LABELS[s]
                    }))].map(
                        ({key, label}) => {
                            const count = counts[key] ?? 0;
                            if (count === 0 && key !== "ALL") return null;
                            const active = statusFilter === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={[
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[12px] transition-colors duration-100",
                                        active
                                            ? "bg-[var(--text-1)] text-white"
                                            : "bg-[var(--surface-raised)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--border)]",
                                    ].join(" ")}
                                >
                                    {label}
                                    <span className={active ? "opacity-50 text-[11px]" : "text-[11px] text-[var(--text-4)]"}>
                                        {count}
                                    </span>
                                </button>
                            );
                        },
                    )}
                </div>

                <div className="relative ml-auto w-full sm:w-auto">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-4)] pointer-events-none"/>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search…"
                        className="pl-7 pr-3 py-1.5 w-full sm:w-[200px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No members found.</p>
            ) : (
                <div>
                    {/* Select-all header */}
                    <div className="flex items-center gap-4 py-2 border-b border-[var(--border)] mb-1">
                        <Checkbox
                            checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                            onCheckedChange={toggleAll}
                        />
                        <span className="text-[11px] text-[var(--text-4)]">
                            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                        </span>
                    </div>

                    {filtered.map((member) => {
                        const status = member.statusHistory[0]?.status ?? "NEWBIE";
                        const isChecked = selected.has(member.id);
                        return (
                            <div
                                key={member.id}
                                className={[
                                    "flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0",
                                    "-mx-2 px-2 transition-colors",
                                    isChecked ? "bg-[var(--surface-raised)]" : "",
                                ].join(" ")}
                            >
                                <Checkbox checked={isChecked} onCheckedChange={() => toggle(member.id)}/>
                                <div className="w-7 h-7 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-3)] shrink-0 overflow-hidden">
                                    {member.photoUrl ? (
                                        <Image src={member.photoUrl} alt={member.fullName} width={28} height={28} className="w-full h-full object-cover"/>
                                    ) : (
                                        member.fullName.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[var(--text-1)] truncate">{member.fullName}</p>
                                    <p className="text-[11px] text-[var(--text-4)]">{member.slug}</p>
                                </div>
                                <StatusBadge status={status}/>
                                <span className="hidden sm:inline text-[11px] tabular-nums text-[var(--text-4)] shrink-0">
                                    {new Date(member.joinedAt).getFullYear()}
                                </span>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link href={`/admin/members/${member.id}/edit`} className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] no-underline transition-colors">
                                        Edit
                                    </Link>
                                    <Link href={`/members/${member.slug}`} target="_blank" className="hidden sm:inline text-[11px] text-[var(--text-4)] hover:text-[var(--text-1)] no-underline transition-colors">
                                        View
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--text-1)] text-white shadow-lg text-[13px] max-w-[calc(100vw-32px)] whitespace-nowrap">
                    <span className="font-medium">{selected.size} selected</span>
                    <span className="opacity-30">·</span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isPending}
                        className={[
                            "font-medium transition-colors",
                            confirmDelete ? "text-red-400 hover:text-red-300" : "text-[var(--accent-light)] hover:opacity-80",
                        ].join(" ")}
                    >
                        {isPending ? "Deleting…" : confirmDelete ? `Confirm delete ${selected.size}` : "Delete"}
                    </button>
                    {confirmDelete && (
                        <button onClick={() => setConfirmDelete(false)} className="opacity-50 hover:opacity-80 transition-opacity text-[12px]">
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
