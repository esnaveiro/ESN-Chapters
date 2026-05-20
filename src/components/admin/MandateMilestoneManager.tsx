"use client";

import {useState, useTransition} from "react";
import {MilestoneType} from "@/generated/prisma/enums";
import {createMilestone, deleteMilestone} from "@/actions/milestones";
import {Select} from "@/components/ui/Select";
import {Button} from "@/components/ui/Button";

type Milestone = {
    id: string;
    title: string;
    description: string | null;
    happenedAt: Date;
    type: MilestoneType;
};

type Props = {
    mandateId: string;
    milestones: Milestone[];
};

const TYPE_META: Record<MilestoneType, { label: string; color: string }> = {
    EVENT: {label: "Event", color: "#0ea5e9"},
    FIRST: {label: "First", color: "#7ac143"},
    AWARD: {label: "Award", color: "#facc15"},
    OTHER: {label: "Other", color: "#b5b5b5"},
};

const TYPE_OPTIONS = Object.values(MilestoneType).map((t) => ({
    value: t,
    label: TYPE_META[t].label,
}));

export function MandateMilestoneManager({mandateId, milestones}: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [happenedAt, setHappenedAt] = useState("");
    const [type, setType] = useState<MilestoneType | "">(MilestoneType.EVENT);
    const [error, setError] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleAdd() {
        if (!title.trim()) { setError("Title is required."); return; }
        if (!happenedAt) { setError("Date is required."); return; }
        if (!type) { setError("Type is required."); return; }
        setError("");
        startTransition(async () => {
            const result = await createMilestone({
                title: title.trim(),
                description: description.trim() || undefined,
                happenedAt,
                type: type as MilestoneType,
                mandateId,
            });
            if (result.success) {
                setTitle("");
                setDescription("");
                setHappenedAt("");
                setType(MilestoneType.EVENT);
            } else {
                setError(result.error ?? "Failed to add milestone.");
            }
        });
    }

    function handleDelete(id: string) {
        if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
        startTransition(async () => {
            await deleteMilestone(id);
            setConfirmDeleteId(null);
        });
    }

    return (
        <div>
            {/* Existing milestones */}
            {milestones.length > 0 && (
                <div className="mb-6">
                    {milestones.map((m) => {
                        const {label, color} = TYPE_META[m.type];
                        return (
                            <div key={m.id} className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
                                <div className="w-2 h-2 rounded-full shrink-0 mt-[5px]" style={{background: color}}/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[var(--text-1)] leading-snug">{m.title}</p>
                                    {m.description && (
                                        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{m.description}</p>
                                    )}
                                    <p className="text-[11px] text-[var(--text-4)] mt-1 tabular-nums">
                                        {new Date(m.happenedAt).toLocaleDateString("en-GB")}
                                        <span className="mx-1.5">·</span>
                                        <span style={{color}}>{label}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(m.id)}
                                    disabled={isPending}
                                    className={[
                                        "text-[11px] shrink-0 transition-colors pt-0.5",
                                        confirmDeleteId === m.id
                                            ? "text-red-500 hover:text-red-600 font-medium"
                                            : "text-[var(--text-4)] hover:text-[var(--text-2)]",
                                    ].join(" ")}
                                >
                                    {confirmDeleteId === m.id ? "Confirm" : "Delete"}
                                </button>
                                {confirmDeleteId === m.id && (
                                    <button
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="text-[11px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors shrink-0 pt-0.5"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add form */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                    <input
                        type="date"
                        value={happenedAt}
                        onChange={(e) => setHappenedAt(e.target.value)}
                        className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                    <div className="w-36">
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as MilestoneType)}
                            options={TYPE_OPTIONS}
                            placeholder="Type…"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                    <Button size="sm" variant="secondary" onClick={handleAdd} disabled={isPending}>
                        Add milestone
                    </Button>
                </div>
                {error && <p className="text-[12px] text-red-500">{error}</p>}
            </div>
        </div>
    );
}
