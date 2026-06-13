"use client";

import {useState, useTransition} from "react";
import Link from "next/link";
import {EventType} from "@/generated/prisma/enums";
import {Button} from "@/components/ui/Button";
import {Checkbox} from "@/components/ui/Checkbox";
import {deleteEvents} from "@/actions/events";

type EventRow = {
    id: string;
    title: string;
    locationName: string | null;
    startsAt: Date;
    endsAt: Date;
    eventType: EventType;
    scope: string;
    showOnTimeline: boolean;
    mandate: { id: string; name: string } | null;
    _count: { participations: number };
};

type Props = {
    events: EventRow[];
};

const TYPE_META: Record<EventType, { label: string; color: string }> = {
    ACTIVITIES: {label: "Activities", color: "#ec008c"},
    CULTURAL: {label: "Cultural", color: "#00aeef"},
    PROJECTS: {label: "Projects", color: "#7ac143"},
    OTHER: {label: "Other", color: "#f47b20"},
};

const ALL_TYPES = Object.values(EventType);

function dateLabel(start: Date, end: Date) {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = s.toISOString().slice(0, 10) === e.toISOString().slice(0, 10);
    const fmt = (d: Date) => d.toLocaleDateString("en-GB");
    return sameDay ? fmt(s) : `${fmt(s)} – ${fmt(e)}`;
}

export function EventManager({events}: Props) {
    const [typeFilter, setTypeFilter] = useState<EventType | "ALL">("ALL");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isPending, startTransition] = useTransition();

    const visible = typeFilter === "ALL" ? events : events.filter((e) => e.eventType === typeFilter);

    const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.id));
    const someVisibleSelected = visible.some((e) => selected.has(e.id));

    function toggleAll() {
        if (allVisibleSelected) {
            setSelected((prev) => {
                const next = new Set(prev);
                visible.forEach((e) => next.delete(e.id));
                return next;
            });
        } else {
            setSelected((prev) => {
                const next = new Set(prev);
                visible.forEach((e) => next.add(e.id));
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
            await deleteEvents([...selected]);
            setSelected(new Set());
            setConfirmDelete(false);
        });
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex flex-wrap gap-1.5 flex-1">
                    {[{key: "ALL" as const, label: "All", color: ""}, ...ALL_TYPES.map((t) => ({key: t, ...TYPE_META[t]}))].map(
                        ({key, label, color}) => {
                            const count = key === "ALL" ? events.length : events.filter((e) => e.eventType === key).length;
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
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background: active ? "white" : color}}/>
                                    )}
                                    {label}
                                    <span className={active ? "opacity-50 text-[11px]" : "text-[11px] text-[var(--text-4)]"}>{count}</span>
                                </button>
                            );
                        }
                    )}
                </div>
                <Link href="/admin/events/new">
                    <Button size="sm" variant="secondary">Add event</Button>
                </Link>
            </div>

            {/* List */}
            {events.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No events yet.</p>
            ) : visible.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No events match this filter.</p>
            ) : (
                <div>
                    {/* Select-all header */}
                    <div className="flex items-center gap-4 py-2 border-b border-[var(--border)] mb-1">
                        <Checkbox
                            checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                            onCheckedChange={toggleAll}
                        />
                        <span className="text-[11px] text-[var(--text-4)]">
                            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
                        </span>
                    </div>

                    {visible.map((e) => {
                        const {label, color} = TYPE_META[e.eventType] ?? TYPE_META.OTHER;
                        const isChecked = selected.has(e.id);
                        return (
                            <div key={e.id}
                                 className={[
                                     "flex items-start gap-4 py-4 border-b border-[var(--border)] last:border-0",
                                     "-mx-2 px-2 transition-colors",
                                     isChecked ? "bg-[var(--surface-raised)]" : "",
                                 ].join(" ")}>
                                <Checkbox checked={isChecked} onCheckedChange={() => toggle(e.id)} className="mt-[3px]"/>
                                <div className="w-2 h-2 rounded-full shrink-0 mt-[5px]" style={{background: color}}/>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[13px] font-semibold text-[var(--text-1)] leading-snug">{e.title}</p>
                                        {!e.showOnTimeline && (
                                            <span className="text-[10px] font-semibold tracking-[0.06em] uppercase rounded-full px-2 py-[1px] bg-[var(--surface-sunken)] text-[var(--text-4)]">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-[var(--text-4)] mt-1 tabular-nums">
                                        {dateLabel(e.startsAt, e.endsAt)}
                                        <span className="mx-1.5">·</span>
                                        <span style={{color}}>{label}</span>
                                        <span className="mx-1.5">·</span>
                                        <span className="capitalize">{e.scope.toLowerCase()}</span>
                                        {e.locationName && <><span className="mx-1.5">·</span>{e.locationName}</>}
                                        {e.mandate && <><span className="mx-1.5">·</span>{e.mandate.name}</>}
                                        {e._count.participations > 0 && (
                                            <><span className="mx-1.5">·</span>{e._count.participations} participant{e._count.participations === 1 ? "" : "s"}</>
                                        )}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/events/${e.id}/edit`}
                                    className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors shrink-0 pt-px"
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
