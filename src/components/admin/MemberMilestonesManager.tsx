"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Combobox} from "@/components/ui/Combobox";
import {addMilestoneMember, removeMilestoneMember} from "@/actions/milestones";

type MilestoneOption = { id: string; title: string; happenedAt: string; type: string };
type MilestoneLink = { id: string; milestone: MilestoneOption };

type Props = {
    memberId: string;
    links: MilestoneLink[];
    allMilestones: MilestoneOption[];
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
}

export function MemberMilestonesManager({memberId, links, allMilestones}: Props) {
    const router = useRouter();
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const linkedIds = new Set(links.map((l) => l.milestone.id));
    const options = allMilestones
        .filter((m) => !linkedIds.has(m.id))
        .map((m) => ({value: m.id, label: `${m.title} · ${formatDate(m.happenedAt)}`}));

    async function handleAdd() {
        if (!selected) return;
        setLoading(true);
        setError("");
        const result = await addMilestoneMember(selected, memberId);
        setLoading(false);
        if (!result.success) { setError(result.error); return; }
        setAdding(false);
        setSelected("");
        router.refresh();
    }

    async function handleRemove(linkId: string) {
        if (confirmingId !== linkId) {
            setConfirmingId(linkId);
            return;
        }
        setLoading(true);
        setError("");
        const result = await removeMilestoneMember(linkId, memberId);
        setLoading(false);
        if (!result.success) { setError(result.error); setConfirmingId(null); return; }
        setConfirmingId(null);
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-3">
            {links.length === 0 && !adding && (
                <p className="text-[13px] text-[var(--text-4)]">No milestones linked.</p>
            )}

            {links.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[13px] font-medium text-[var(--text-1)]">{l.milestone.title}</span>
                    <span className="text-[12px] text-[var(--text-4)]">{formatDate(l.milestone.happenedAt)}</span>
                    <span className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[var(--text-3)]">
                        {l.milestone.type.replace(/_/g, " ")}
                    </span>
                    {confirmingId === l.id ? (
                        <>
                            <button
                                onClick={() => handleRemove(l.id)}
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
                            onClick={() => setConfirmingId(l.id)}
                            className="text-[12px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}

            {adding ? (
                <div className="flex flex-col gap-2 max-w-[480px] mt-1">
                    <Combobox
                        value={selected}
                        onValueChange={setSelected}
                        options={options}
                        placeholder="— search milestones —"
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={!selected || loading}>
                            {loading ? "Saving…" : "Link milestone"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setSelected(""); }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                options.length > 0 && (
                    <button
                        onClick={() => setAdding(true)}
                        className="self-start text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    >
                        + Link milestone
                    </button>
                )
            )}

            {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>
    );
}
