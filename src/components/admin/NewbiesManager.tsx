"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {removeBuddyLink, setBuddyLink} from "@/actions/members";

type MemberOption = { id: string; fullName: string };

type Props = {
    buddyId: string;
    currentNewbies: MemberOption[];
    allMembers: MemberOption[];
};

export function NewbiesManager({buddyId, currentNewbies, allMembers}: Props) {
    const router = useRouter();
    const [adding, setAdding] = useState(false);
    const [selected, setSelected] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const currentIds = new Set(currentNewbies.map((n) => n.id));
    const options = allMembers.filter((m) => m.id !== buddyId && !currentIds.has(m.id));

    async function handleAdd() {
        if (!selected) return;
        setLoading(true);
        setError("");
        const result = await setBuddyLink(buddyId, selected);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
        setAdding(false);
        setSelected("");
        router.refresh();
        setLoading(false);
    }

    async function handleRemove(newbieId: string) {
        if (confirmingId !== newbieId) {
            setConfirmingId(newbieId);
            return;
        }
        setLoading(true);
        setError("");
        const result = await removeBuddyLink(newbieId);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            setConfirmingId(null);
            return;
        }
        setConfirmingId(null);
        router.refresh();
        setLoading(false);
    }

    return (
        <div className="flex flex-col gap-3">
            {currentNewbies.length === 0 && !adding && (
                <p className="text-[13px] text-[var(--text-4)]">No newbies assigned.</p>
            )}

            {currentNewbies.map((newbie) => (
                <div key={newbie.id} className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-[var(--text-1)]">{newbie.fullName}</span>
                    {confirmingId === newbie.id ? (
                        <>
                            <button
                                onClick={() => handleRemove(newbie.id)}
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
                            onClick={() => {
                                setConfirmingId(newbie.id);
                            }}
                            className="text-[12px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}

            {adding ? (
                <div className="flex flex-col gap-2 max-w-[480px]">
                    <Select
                        value={selected}
                        onValueChange={setSelected}
                        placeholder="— select a member —"
                        options={options.map((m) => ({value: m.id, label: m.fullName}))}
                    />
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={!selected || loading}>
                            {loading ? "Saving…" : "Add newbie"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                            setAdding(false);
                            setSelected("");
                        }}>
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
                        + Add newbie
                    </button>
                )
            )}

            {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>
    );
}
