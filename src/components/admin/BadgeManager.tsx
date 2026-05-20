"use client";

import {useState, useTransition} from "react";
import Link from "next/link";
import {BadgeIcon} from "@/components/ui/BadgeIcon";
import {Button} from "@/components/ui/Button";
import {Checkbox} from "@/components/ui/Checkbox";
import {deleteBadges} from "@/actions/badges";

type Badge = {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    memberBadges: { id: string }[];
};

type Props = {
    badges: Badge[];
};

export function BadgeManager({badges}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    const allSelected = badges.length > 0 && badges.every((b) => selected.has(b.id));
    const someSelected = badges.some((b) => selected.has(b.id));

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(badges.map((b) => b.id)));
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
            await deleteBadges([...selected]);
            setSelected(new Set());
            setConfirmDelete(false);
        });
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)]">
                    {badges.length} {badges.length === 1 ? "badge" : "badges"} defined
                </p>
                <Link href="/admin/badges/new">
                    <Button size="sm" variant="secondary">New badge</Button>
                </Link>
            </div>

            {badges.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No badges defined yet.</p>
            ) : (
                <div>
                    {/* Select-all header */}
                    <div className="flex items-center gap-4 py-2 border-b border-[var(--border)] mb-1">
                        <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={toggleAll}
                        />
                        <span className="text-[11px] text-[var(--text-4)]">
                            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                        </span>
                    </div>

                    {badges.map((badge) => {
                        const isChecked = selected.has(badge.id);
                        return (
                            <div key={badge.id}
                                 className={[
                                     "flex items-center gap-3 py-4 border-b border-[var(--border)] last:border-0",
                                     "-mx-2 px-2 transition-colors",
                                     isChecked ? "bg-[var(--surface-raised)]" : "",
                                 ].join(" ")}>
                                <Checkbox checked={isChecked} onCheckedChange={() => toggle(badge.id)}/>
                                {badge.icon ? (
                                    <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--surface-raised)] flex items-center justify-center shrink-0 text-[var(--text-2)]">
                                        <BadgeIcon name={badge.icon} size={15}/>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 shrink-0"/>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[var(--text-1)]">{badge.name}</p>
                                    {badge.description && (
                                        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{badge.description}</p>
                                    )}
                                </div>
                                <span className="text-[11px] tabular-nums text-[var(--text-4)] shrink-0">
                                    {badge.memberBadges.length} awarded
                                </span>
                                <Link
                                    href={`/admin/badges/${badge.id}/edit`}
                                    className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors shrink-0"
                                >
                                    Edit
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Bulk action bar */}
            {selected.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--text-1)] text-white shadow-lg text-[13px]">
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
