"use client";

import {useState, useTransition} from "react";
import Link from "next/link";
import {deleteMandates} from "@/actions/mandates";
import {getMandateColor} from "@/lib/utils";
import {Checkbox} from "@/components/ui/Checkbox";

type Mandate = {
    id: string;
    name: string;
    academicYear: string;
    colorIndex: number;
    customColor: string | null;
    _count: { memberships: number; events: number };
};

type Props = {
    mandates: Mandate[];
};

export function MandatesManager({mandates}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    const allSelected = mandates.length > 0 && mandates.every((m) => selected.has(m.id));
    const someSelected = mandates.some((m) => selected.has(m.id));

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(mandates.map((m) => m.id)));
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
            await deleteMandates([...selected]);
            setSelected(new Set());
            setConfirmDelete(false);
        });
    }

    if (mandates.length === 0) {
        return <p className="text-[13px] text-[var(--text-4)] py-10">No mandates yet.</p>;
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

            {mandates.map((mandate, i) => {
                const color = getMandateColor(mandate.colorIndex, mandate.customColor);
                const isChecked = selected.has(mandate.id);
                return (
                    <div
                        key={mandate.id}
                        className={[
                            "flex items-center gap-4 py-4 border-b border-[var(--border)] last:border-0",
                            "-mx-2 px-2 transition-colors",
                            isChecked ? "bg-[var(--surface-raised)]" : "",
                        ].join(" ")}
                    >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggle(mandate.id)}/>
                        <span className="text-[11px] tabular-nums text-[var(--text-4)] w-7 shrink-0">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{background: color}}/>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] tabular-nums font-medium text-[var(--text-4)] leading-none mb-0.5">
                                {mandate.academicYear}
                            </p>
                            <p className="text-[14px] font-semibold text-[var(--text-1)] truncate">
                                {mandate.name}
                            </p>
                        </div>
                        <p className="text-[11px] text-[var(--text-4)] shrink-0">
                            {mandate._count.memberships} vol.
                            <span className="mx-1.5 text-[var(--border-strong)]">·</span>
                            {mandate._count.events} events
                        </p>
                        <Link
                            href={`/admin/mandates/${mandate.id}/edit`}
                            className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] no-underline transition-colors shrink-0"
                        >
                            Edit
                        </Link>
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
