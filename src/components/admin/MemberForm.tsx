"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {MemberStatus} from "@/generated/prisma/enums";
import {Input, Textarea} from "@/components/ui/Input";
import {Select} from "@/components/ui/Select";
import {Button} from "@/components/ui/Button";
import {STATUS_LABELS} from "@/lib/utils";
import {createMember, MemberFormData, StatusEntry, updateMember} from "@/actions/members";
import {PhotoUpload} from "./PhotoUpload";

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

type MemberOption = { id: string; fullName: string };

type Props = {
    mode: "create" | "edit";
    memberId?: string;
    defaultValues?: Partial<MemberFormData & { id: string }>;
    members?: MemberOption[];
};

const STATUS_OPTIONS = Object.values(MemberStatus).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
}));

function StatusHistoryBuilder({
                                  entries,
                                  onChange,
                              }: {
    entries: StatusEntry[];
    onChange: (entries: StatusEntry[]) => void;
}) {
    function update(i: number, field: keyof StatusEntry, value: string) {
        const next = entries.map((e, idx) =>
            idx === i ? {...e, [field]: value} : e
        );
        onChange(next);
    }

    function add() {
        onChange([...entries, {status: "NEWBIE" as MemberStatus, startedAt: ""}]);
    }

    function remove(i: number) {
        onChange(entries.filter((_, idx) => idx !== i));
    }

    return (
        <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                    <Select
                        value={entry.status}
                        onValueChange={(v) => update(i, "status", v)}
                        options={STATUS_OPTIONS}
                    />
                    <input
                        type="date"
                        value={entry.startedAt}
                        onChange={(e) => update(i, "startedAt", e.target.value)}
                        className={inputBase}
                    />
                    {entries.length > 1 && (
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors shrink-0"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={add}
                className="self-start text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
            >
                + Add status entry
            </button>
        </div>
    );
}

export function MemberForm({mode, memberId, defaultValues, members = []}: Props) {
    const router = useRouter();
    const [photoUrl, setPhotoUrl] = useState(defaultValues?.photoUrl ?? "");
    const [statusHistory, setStatusHistory] = useState<StatusEntry[]>([
        {status: "NEWBIE", startedAt: ""},
    ]);
    const [buddyId, setBuddyId] = useState("");
    const [newbieIds, setNewbieIds] = useState<string[]>([]);
    const [addingNewbie, setAddingNewbie] = useState(false);
    const [newbieSelected, setNewbieSelected] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const fd = new FormData(e.currentTarget);
        const joinedAt = fd.get("joinedAt") as string;

        if (mode === "create") {
            const filledHistory = statusHistory.filter((e) => e.startedAt);
            const history =
                filledHistory.length > 0
                    ? filledHistory
                    : [{status: statusHistory[0]?.status ?? ("NEWBIE" as MemberStatus), startedAt: joinedAt}];

            const data: MemberFormData = {
                fullName: fd.get("fullName") as string,
                bio: fd.get("bio") as string,
                favouriteMemory: fd.get("favouriteMemory") as string,
                linkedinUrl: fd.get("linkedinUrl") as string,
                joinedAt,
                photoUrl,
                statusHistory: history,
                buddyId: buddyId || undefined,
                newbieIds: newbieIds.length ? newbieIds : undefined,
            };

            const result = await createMember(data);
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
        } else {
            const result = await updateMember(memberId!, {
                fullName: fd.get("fullName") as string,
                bio: fd.get("bio") as string,
                favouriteMemory: fd.get("favouriteMemory") as string,
                linkedinUrl: fd.get("linkedinUrl") as string,
                joinedAt,
                photoUrl,
            });
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
        }

        router.push("/admin/members");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PhotoUpload
                bucket="member-photos"
                currentUrl={photoUrl}
                onUpload={setPhotoUrl}
                label="Profile photo"
            />

            <Input
                label="Full name"
                name="fullName"
                id="fullName"
                required
                defaultValue={defaultValues?.fullName}
                placeholder="e.g. Daniela Dias"
            />

            <Input
                label="Join date"
                name="joinedAt"
                id="joinedAt"
                type="date"
                required
                defaultValue={
                    defaultValues?.joinedAt
                        ? new Date(defaultValues.joinedAt).toISOString().split("T")[0]
                        : ""
                }
            />

            {mode === "create" && (
                <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-[var(--text-2)]">
                        Status history
                    </label>
                    <p className="text-[11px] text-[var(--text-4)] -mt-1">
                        Add each status change with its start date. Leave dates blank to use the join date.
                    </p>
                    <StatusHistoryBuilder
                        entries={statusHistory}
                        onChange={setStatusHistory}
                    />
                </div>
            )}

            {mode === "create" && members.length > 0 && (
                <>
                    {/* My buddy (newbie ← buddy) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-medium text-[var(--text-2)]">My buddy</label>
                        <p className="text-[11px] text-[var(--text-4)] -mt-1">Who mentored this member when they
                            joined.</p>
                        <Select
                            value={buddyId}
                            onValueChange={setBuddyId}
                            placeholder="— none —"
                            options={members.map((m) => ({value: m.id, label: m.fullName}))}
                        />
                    </div>

                    {/* My newbies (buddy → newbies) */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-medium text-[var(--text-2)]">My newbies</label>
                        <p className="text-[11px] text-[var(--text-4)] -mt-1">Members this person is mentoring.</p>
                        <div className="flex flex-col gap-2">
                            {newbieIds.map((id) => {
                                const m = members.find((m) => m.id === id);
                                return (
                                    <div key={id} className="flex items-center gap-3">
                                        <span className="text-[13px] text-[var(--text-1)]">{m?.fullName ?? id}</span>
                                        <button
                                            type="button"
                                            onClick={() => setNewbieIds(newbieIds.filter((n) => n !== id))}
                                            className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                            {addingNewbie ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 max-w-[300px]">
                                        <Select
                                            value={newbieSelected}
                                            onValueChange={setNewbieSelected}
                                            placeholder="— select a member —"
                                            options={members
                                                .filter((m) => !newbieIds.includes(m.id))
                                                .map((m) => ({value: m.id, label: m.fullName}))}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newbieSelected) setNewbieIds([...newbieIds, newbieSelected]);
                                            setNewbieSelected("");
                                            setAddingNewbie(false);
                                        }}
                                        className="text-[12px] font-medium text-[var(--accent)] hover:opacity-70 transition-opacity disabled:opacity-40"
                                    >
                                        Add
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddingNewbie(false);
                                            setNewbieSelected("");
                                        }}
                                        className="text-[12px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAddingNewbie(true)}
                                    className="self-start text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                                >
                                    + Add newbie
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            <Textarea
                label="Bio"
                name="bio"
                id="bio"
                defaultValue={defaultValues?.bio ?? ""}
                placeholder="A short biography..."
            />

            <Textarea
                label="Favourite memory"
                name="favouriteMemory"
                id="favouriteMemory"
                defaultValue={defaultValues?.favouriteMemory ?? ""}
                placeholder="Their most memorable ESN moment..."
            />

            <Input
                label="LinkedIn URL"
                name="linkedinUrl"
                id="linkedinUrl"
                type="url"
                defaultValue={defaultValues?.linkedinUrl ?? ""}
                placeholder="https://linkedin.com/in/..."
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                    {loading
                        ? "Saving…"
                        : mode === "create"
                            ? "Add member"
                            : "Save changes"}
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
