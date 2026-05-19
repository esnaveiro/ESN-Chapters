"use client";

import {useState} from "react";
import Link from "next/link";
import {MilestoneType} from "@/generated/prisma/enums";
import {Button} from "@/components/ui/Button";

type Milestone = {
    id: string;
    title: string;
    description: string | null;
    happenedAt: Date;
    type: MilestoneType;
    mandate: { id: string; name: string } | null;
};

type Props = {
    milestones: Milestone[];
};

const TYPE_META: Record<MilestoneType, { label: string; color: string }> = {
    EVENT: {label: "Event", color: "#0ea5e9"},
    FIRST: {label: "First", color: "#7ac143"},
    AWARD: {label: "Award", color: "#facc15"},
    OTHER: {label: "Other", color: "#b5b5b5"},
};

const ALL_TYPES = Object.values(MilestoneType);

export function MilestoneManager({milestones}: Props) {
    const [typeFilter, setTypeFilter] = useState<MilestoneType | "ALL">("ALL");

    const visible = typeFilter === "ALL" ? milestones : milestones.filter((m) => m.type === typeFilter);

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {[{
                        key: "ALL" as const,
                        label: "All",
                        color: ""
                    }, ...ALL_TYPES.map((t) => ({key: t, ...TYPE_META[t]}))].map(
                        ({key, label, color}) => {
                            const count = key === "ALL" ? milestones.length : milestones.filter((m) => m.type === key).length;
                            if (count === 0 && key !== "ALL") return null;
                            const active = typeFilter === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setTypeFilter(key)}
                                    className={[
                                        "flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] text-[12px] transition-colors duration-100",
                                        active
                                            ? "bg-[var(--text-1)] text-white"
                                            : "bg-[var(--surface-raised)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--border)]",
                                    ].join(" ")}
                                >
                                    {key !== "ALL" && (
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                              style={{background: active ? "white" : color}}/>
                                    )}
                                    {label}
                                    <span
                                        className={active ? "opacity-50 text-[11px]" : "text-[11px] text-[var(--text-4)]"}>{count}</span>
                                </button>
                            );
                        }
                    )}
                </div>
                <Link href="/admin/milestones/new">
                    <Button size="sm" variant="secondary">Add milestone</Button>
                </Link>
            </div>

            {/* List */}
            {milestones.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No milestones yet.</p>
            ) : visible.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No milestones match this filter.</p>
            ) : (
                <div>
                    {visible.map((m, i) => {
                        const {label, color} = TYPE_META[m.type] ?? TYPE_META.OTHER;
                        return (
                            <div key={m.id}
                                 className="flex items-start gap-4 py-4 border-b border-[var(--border)] last:border-0">
                <span className="text-[11px] tabular-nums text-[var(--text-4)] w-7 shrink-0 pt-px">
                  {String(i + 1).padStart(2, "0")}
                </span>
                                <div className="w-2 h-2 rounded-full shrink-0 mt-[5px]" style={{background: color}}/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-semibold text-[var(--text-1)] leading-snug">{m.title}</p>
                                    {m.description && (
                                        <p className="text-[12px] text-[var(--text-3)] mt-0.5 leading-snug">{m.description}</p>
                                    )}
                                    <p className="text-[11px] text-[var(--text-4)] mt-1 tabular-nums">
                                        {new Date(m.happenedAt).toLocaleDateString("en-GB")}
                                        <span className="mx-1.5">·</span>
                                        <span style={{color}}>{label}</span>
                                        {m.mandate && <><span className="mx-1.5">·</span>{m.mandate.name}</>}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/milestones/${m.id}/edit`}
                                    className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors shrink-0 pt-px"
                                >
                                    Edit
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
