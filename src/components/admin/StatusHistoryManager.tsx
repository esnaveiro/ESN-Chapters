"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {MemberStatus} from "@/generated/prisma/enums";
import {Select} from "@/components/ui/Select";
import {Button} from "@/components/ui/Button";
import {STATUS_LABELS} from "@/lib/utils";
import {setStatusHistory} from "@/actions/members";

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

const STATUS_OPTIONS = Object.values(MemberStatus).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
}));

type Entry = { status: MemberStatus; startedAt: string; semester?: number | null };

type Props = {
    memberId: string;
    initialEntries: Entry[];
};

export function StatusHistoryManager({memberId, initialEntries}: Props) {
    const router = useRouter();
    const [entries, setEntries] = useState<Entry[]>(initialEntries);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function update(i: number, field: keyof Entry, value: string | number | null) {
        setEntries((prev) =>
            prev.map((e, idx) => (idx === i ? {...e, [field]: value} : e))
        );
    }

    function add() {
        setEntries((prev) => [...prev, {status: "NEWBIE" as MemberStatus, startedAt: "", semester: null}]);
    }

    function remove(i: number) {
        setEntries((prev) => prev.filter((_, idx) => idx !== i));
    }

    async function handleSave() {
        const valid = entries.filter((e) => e.startedAt);
        if (valid.length === 0) {
            setError("At least one entry with a date is required");
            return;
        }
        setLoading(true);
        setError("");
        const result = await setStatusHistory(memberId, valid);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
        router.refresh();
        setLoading(false);
    }

    return (
        <div className="flex flex-col gap-3">
            {entries.map((entry, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                    <Select
                        value={entry.status}
                        onValueChange={(v) => update(i, "status", v as MemberStatus)}
                        options={STATUS_OPTIONS}
                    />
                    <input
                        type="month"
                        value={entry.startedAt.substring(0, 7)}
                        onChange={(e) => update(i, "startedAt", e.target.value)}
                        className={inputBase}
                    />
                    <div className="flex rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden text-[11px] font-semibold shrink-0">
                        {[1, 2].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => update(i, "semester", entry.semester === s ? null : s)}
                                className="px-2 py-1.5 transition-colors"
                                style={{
                                    background: entry.semester === s ? "var(--accent)" : "var(--surface)",
                                    color: entry.semester === s ? "white" : "var(--text-3)",
                                    borderRight: s === 1 ? "1px solid var(--border)" : undefined,
                                }}
                            >
                                S{s}
                            </button>
                        ))}
                    </div>
                    {entries.length > 1 && (
                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors"
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
                + Add entry
            </button>

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <div>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                    {loading ? "Saving…" : "Save status history"}
                </Button>
            </div>
        </div>
    );
}
