"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {EventScope, EventType} from "@/generated/prisma/enums";
import {Button} from "@/components/ui/Button";
import {Input} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {Combobox} from "@/components/ui/Combobox";
import {Checkbox} from "@/components/ui/Checkbox";
import {addParticipant, createEventForMember, removeParticipant} from "@/actions/events";

type EventOption = { id: string; title: string; startsAt: string; showOnTimeline: boolean };
type Participation = { id: string; role: string; event: EventOption };

type Props = {
    memberId: string;
    participations: Participation[];
    allEvents: EventOption[];
};

const SCOPE_OPTIONS = [
    {value: EventScope.LOCAL, label: "Local"},
    {value: EventScope.NATIONAL, label: "National"},
    {value: EventScope.INTERNATIONAL, label: "International"},
];

const TYPE_OPTIONS = [
    {value: EventType.ACTIVITIES, label: "Activities"},
    {value: EventType.CULTURAL, label: "Cultural"},
    {value: EventType.PROJECTS, label: "Projects"},
    {value: EventType.OTHER, label: "Other"},
];

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

const emptyNewEvent = {
    title: "",
    startsAt: "",
    endsAt: "",
    locationName: "",
    scope: EventScope.LOCAL as EventScope,
    eventType: EventType.ACTIVITIES as EventType,
    showOnTimeline: true,
    role: "Participant",
};

export function MemberEventsManager({memberId, participations, allEvents}: Props) {
    const router = useRouter();
    const [mode, setMode] = useState<"none" | "link" | "create">("none");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    // Link-existing state
    const [selectedEvent, setSelectedEvent] = useState("");
    const [linkRole, setLinkRole] = useState("Participant");

    // Create-new state
    const [draft, setDraft] = useState(emptyNewEvent);

    const linkedIds = new Set(participations.map((p) => p.event.id));
    const linkOptions = allEvents
        .filter((e) => !linkedIds.has(e.id))
        .map((e) => ({value: e.id, label: `${e.title} · ${formatDate(e.startsAt)}`}));

    function resetForms() {
        setMode("none");
        setSelectedEvent("");
        setLinkRole("Participant");
        setDraft(emptyNewEvent);
        setError("");
    }

    async function handleLink() {
        if (!selectedEvent) return;
        setLoading(true);
        setError("");
        const result = await addParticipant(selectedEvent, memberId, linkRole.trim() || "Participant");
        setLoading(false);
        if (!result.success) { setError(result.error); return; }
        resetForms();
        router.refresh();
    }

    async function handleCreate() {
        if (!draft.title.trim() || !draft.startsAt) {
            setError("Title and start date are required.");
            return;
        }
        setLoading(true);
        setError("");
        const result = await createEventForMember(memberId, draft.role, {
            title: draft.title.trim(),
            startsAt: draft.startsAt,
            endsAt: draft.endsAt || draft.startsAt,
            locationName: draft.locationName.trim() || undefined,
            scope: draft.scope,
            eventType: draft.eventType,
            showOnTimeline: draft.showOnTimeline,
        });
        setLoading(false);
        if (!result.success) { setError(result.error); return; }
        resetForms();
        router.refresh();
    }

    async function handleRemove(participationId: string) {
        if (confirmingId !== participationId) {
            setConfirmingId(participationId);
            return;
        }
        setLoading(true);
        setError("");
        const result = await removeParticipant(participationId, memberId);
        setLoading(false);
        if (!result.success) { setError(result.error); setConfirmingId(null); return; }
        setConfirmingId(null);
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-3">
            {participations.length === 0 && mode === "none" && (
                <p className="text-[13px] text-[var(--text-4)]">No events yet.</p>
            )}

            {participations.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[13px] font-medium text-[var(--text-1)]">{p.event.title}</span>
                    <span className="text-[12px] text-[var(--text-4)]">{formatDate(p.event.startsAt)}</span>
                    {p.role && (
                        <span className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[var(--text-3)]">
                            {p.role}
                        </span>
                    )}
                    {!p.event.showOnTimeline && (
                        <span className="text-[10px] font-semibold tracking-[0.06em] uppercase rounded-full px-2 py-[2px] bg-[var(--surface-sunken)] text-[var(--text-4)]">
                            Hidden from timeline
                        </span>
                    )}
                    {confirmingId === p.id ? (
                        <>
                            <button
                                onClick={() => handleRemove(p.id)}
                                disabled={loading}
                                className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40"
                            >
                                {loading ? "Removing…" : "Confirm remove"}
                            </button>
                            <span className="text-[var(--text-4)] text-[12px]">·</span>
                            <button
                                onClick={() => setConfirmingId(null)}
                                className="text-[12px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setConfirmingId(p.id)}
                            className="text-[12px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}

            {/* ── Link existing event ─────────────────────────────── */}
            {mode === "link" && (
                <div className="flex flex-col gap-2 max-w-[480px] mt-1">
                    <Combobox
                        value={selectedEvent}
                        onValueChange={setSelectedEvent}
                        options={linkOptions}
                        placeholder="— search events —"
                    />
                    <Input
                        label="Role"
                        name="linkRole"
                        value={linkRole}
                        onChange={(e) => setLinkRole(e.target.value)}
                        placeholder="Participant"
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleLink} disabled={!selectedEvent || loading}>
                            {loading ? "Saving…" : "Link event"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={resetForms}>Cancel</Button>
                    </div>
                </div>
            )}

            {/* ── Create new event ────────────────────────────────── */}
            {mode === "create" && (
                <div className="flex flex-col gap-3 max-w-[520px] mt-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                    <Input
                        label="Event title"
                        name="title"
                        value={draft.title}
                        onChange={(e) => setDraft({...draft, title: e.target.value})}
                        required
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Start date"
                            name="startsAt"
                            type="date"
                            value={draft.startsAt}
                            onChange={(e) => setDraft({...draft, startsAt: e.target.value})}
                            required
                        />
                        <Input
                            label="End date"
                            name="endsAt"
                            type="date"
                            value={draft.endsAt}
                            onChange={(e) => setDraft({...draft, endsAt: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Type"
                            value={draft.eventType}
                            onValueChange={(v) => setDraft({...draft, eventType: v as EventType})}
                            options={TYPE_OPTIONS}
                        />
                        <Select
                            label="Scope"
                            value={draft.scope}
                            onValueChange={(v) => setDraft({...draft, scope: v as EventScope})}
                            options={SCOPE_OPTIONS}
                        />
                    </div>
                    <Input
                        label="Location"
                        name="locationName"
                        value={draft.locationName}
                        onChange={(e) => setDraft({...draft, locationName: e.target.value})}
                        placeholder="Optional"
                    />
                    <Input
                        label="Role"
                        name="role"
                        value={draft.role}
                        onChange={(e) => setDraft({...draft, role: e.target.value})}
                        placeholder="Participant"
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                            checked={draft.showOnTimeline}
                            onCheckedChange={(v) => setDraft({...draft, showOnTimeline: v})}
                        />
                        <span className="text-[13px] text-[var(--text-2)]">Show on public timeline</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleCreate} disabled={loading}>
                            {loading ? "Saving…" : "Create & add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={resetForms}>Cancel</Button>
                    </div>
                </div>
            )}

            {mode === "none" && (
                <div className="flex items-center gap-4 mt-1">
                    {linkOptions.length > 0 && (
                        <button
                            onClick={() => { resetForms(); setMode("link"); }}
                            className="self-start text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                        >
                            + Link existing event
                        </button>
                    )}
                    <button
                        onClick={() => { resetForms(); setMode("create"); }}
                        className="self-start text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    >
                        + Create new event
                    </button>
                </div>
            )}

            {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>
    );
}
