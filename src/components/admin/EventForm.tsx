"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {EventScope, EventType} from "@/generated/prisma/enums";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {Checkbox} from "@/components/ui/Checkbox";
import {createEvent, updateEvent, EventFormData} from "@/actions/events";

const TYPE_OPTIONS = [
    {value: EventType.ACTIVITIES, label: "Activities"},
    {value: EventType.CULTURAL, label: "Cultural"},
    {value: EventType.PROJECTS, label: "Projects"},
    {value: EventType.OTHER, label: "Other"},
];

const SCOPE_OPTIONS = [
    {value: EventScope.LOCAL, label: "Local"},
    {value: EventScope.NATIONAL, label: "National"},
    {value: EventScope.INTERNATIONAL, label: "International"},
];

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

type Props = {
    mode: "create" | "edit";
    eventId?: string;
    defaultValues?: Partial<EventFormData>;
    mandates: { id: string; name: string }[];
};

export function EventForm({mode, eventId, defaultValues, mandates}: Props) {
    const router = useRouter();
    const [title, setTitle] = useState(defaultValues?.title ?? "");
    const [desc, setDesc] = useState(defaultValues?.description ?? "");
    const [location, setLocation] = useState(defaultValues?.locationName ?? "");
    const [startsAt, setStartsAt] = useState(defaultValues?.startsAt ?? "");
    const [endsAt, setEndsAt] = useState(defaultValues?.endsAt ?? "");
    const [eventType, setEventType] = useState<EventType>(defaultValues?.eventType ?? "ACTIVITIES");
    const [scope, setScope] = useState<EventScope>(defaultValues?.scope ?? "LOCAL");
    const [mandateId, setMandateId] = useState(defaultValues?.mandateId ?? "");
    const [showOnTimeline, setShowOnTimeline] = useState(defaultValues?.showOnTimeline ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title || !startsAt) { setError("Title and start date are required"); return; }
        setLoading(true); setError("");

        const data: EventFormData = {
            title,
            description: desc,
            locationName: location,
            scope,
            eventType,
            startsAt,
            endsAt: endsAt || startsAt,
            mandateId: mandateId || undefined,
            showOnTimeline,
        };

        const result = mode === "create"
            ? await createEvent(data)
            : await updateEvent(eventId!, data);

        if (!result.success) { setError(result.error); setLoading(false); return; }
        router.push("/admin/events");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Title</label>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Welcome Week Autumn 2025"
                    className={inputBase}
                    required
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Description</label>
                <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Optional context or note…"
                    className={`${inputBase} min-h-[72px] resize-y`}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">Start date</label>
                    <input
                        type="date"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className={inputBase}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">End date</label>
                    <input
                        type="date"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className={inputBase}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">Type</label>
                    <Select
                        value={eventType}
                        onValueChange={(v) => setEventType(v as EventType)}
                        options={TYPE_OPTIONS}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">Scope</label>
                    <Select
                        value={scope}
                        onValueChange={(v) => setScope(v as EventScope)}
                        options={SCOPE_OPTIONS}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Location</label>
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Optional"
                    className={inputBase}
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-[var(--text-2)]">Mandate</label>
                <Select
                    value={mandateId}
                    onValueChange={setMandateId}
                    placeholder="— none —"
                    options={mandates.map((m) => ({value: m.id, label: m.name}))}
                />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={showOnTimeline} onCheckedChange={setShowOnTimeline}/>
                <span className="text-[13px] text-[var(--text-2)]">Show on public timeline</span>
            </label>

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading}>
                    {loading ? "Saving…" : mode === "create" ? "Create event" : "Save changes"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
