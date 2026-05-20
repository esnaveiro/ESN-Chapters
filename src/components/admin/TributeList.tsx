"use client";

import {useState, useTransition} from "react";
import Link from "next/link";
import {deleteTribute, deleteTributes} from "@/actions/members";
import {Checkbox} from "@/components/ui/Checkbox";

type Tribute = {
    id: string;
    message: string;
    createdAt: Date;
    author: {id: string; fullName: string; slug: string};
    recipient: {id: string; fullName: string; slug: string};
};

type Props = {
    tributes: Tribute[];
};

export function TributeList({tributes}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmBulk, setConfirmBulk] = useState(false);
    const [isPending, startTransition] = useTransition();

    const allSelected = tributes.length > 0 && tributes.every((t) => selected.has(t.id));
    const someSelected = tributes.some((t) => selected.has(t.id));

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(tributes.map((t) => t.id)));
        }
        setConfirmBulk(false);
    }

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
        setConfirmBulk(false);
    }

    function handleDelete(tribute: Tribute) {
        if (confirmDeleteId !== tribute.id) { setConfirmDeleteId(tribute.id); return; }
        startTransition(async () => {
            await deleteTribute(tribute.id, tribute.recipient.id);
            setSelected((prev) => { const next = new Set(prev); next.delete(tribute.id); return next; });
            setConfirmDeleteId(null);
        });
    }

    function handleBulkDelete() {
        if (!confirmBulk) { setConfirmBulk(true); return; }
        startTransition(async () => {
            await deleteTributes([...selected]);
            setSelected(new Set());
            setConfirmBulk(false);
        });
    }

    if (tributes.length === 0) {
        return <p className="text-[13px] text-[var(--text-4)] py-6">No tributes yet.</p>;
    }

    return (
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

            {tributes.map((t) => {
                const isChecked = selected.has(t.id);
                return (
                    <div
                        key={t.id}
                        className={[
                            "flex items-start gap-4 py-4 border-b border-[var(--border)] last:border-0 -mx-2 px-2 transition-colors",
                            isChecked ? "bg-[var(--surface-raised)]" : "",
                        ].join(" ")}
                    >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggle(t.id)} className="mt-[3px]"/>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                                <Link
                                    href={`/admin/members/${t.author.id}/edit`}
                                    className="text-[13px] font-semibold text-[var(--text-1)] no-underline hover:text-[var(--accent)] transition-colors"
                                >
                                    {t.author.fullName}
                                </Link>
                                <span className="text-[11px] text-[var(--text-4)]">→</span>
                                <Link
                                    href={`/admin/members/${t.recipient.id}/edit`}
                                    className="text-[13px] font-semibold text-[var(--text-1)] no-underline hover:text-[var(--accent)] transition-colors"
                                >
                                    {t.recipient.fullName}
                                </Link>
                            </div>
                            <p className="text-[13px] text-[var(--text-2)] leading-snug">{t.message}</p>
                            <p className="text-[11px] text-[var(--text-4)] mt-1 tabular-nums">
                                {new Date(t.createdAt).toLocaleDateString("en-GB")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <button
                                onClick={() => handleDelete(t)}
                                disabled={isPending}
                                className={[
                                    "text-[11px] transition-colors",
                                    confirmDeleteId === t.id
                                        ? "text-red-500 hover:text-red-600 font-medium"
                                        : "text-[var(--text-4)] hover:text-[var(--text-2)]",
                                ].join(" ")}
                            >
                                {confirmDeleteId === t.id ? "Confirm" : "Delete"}
                            </button>
                            {confirmDeleteId === t.id && (
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[11px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

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
                            confirmBulk ? "text-red-400 hover:text-red-300" : "text-[var(--accent-light)] hover:opacity-80",
                        ].join(" ")}
                    >
                        {isPending ? "Deleting…" : confirmBulk ? `Confirm delete ${selected.size}` : "Delete"}
                    </button>
                    {confirmBulk && (
                        <button
                            onClick={() => setConfirmBulk(false)}
                            className="opacity-50 hover:opacity-80 transition-opacity text-[12px]"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
