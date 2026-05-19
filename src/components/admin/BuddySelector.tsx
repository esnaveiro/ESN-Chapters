"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {removeBuddyLink, setBuddyLink} from "@/actions/members";

type MemberOption = { id: string; fullName: string };

type Props = {
    newbieId: string;
    members: MemberOption[];
    currentBuddyId?: string;
};

export function BuddySelector({newbieId, members, currentBuddyId}: Props) {
    const router = useRouter();
    const [editing, setEditing] = useState(!currentBuddyId);
    const [selected, setSelected] = useState(currentBuddyId ?? "");
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const buddy = members.find((m) => m.id === currentBuddyId);
    const options = members.filter((m) => m.id !== newbieId);

    async function handleSave() {
        if (!selected) return;
        setLoading(true);
        setError("");
        if (currentBuddyId) await removeBuddyLink(newbieId);
        const result = await setBuddyLink(selected, newbieId);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
        setEditing(false);
        router.refresh();
        setLoading(false);
    }

    async function handleRemove() {
        if (!confirming) {
            setConfirming(true);
            return;
        }
        setLoading(true);
        setError("");
        const result = await removeBuddyLink(newbieId);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            setConfirming(false);
            return;
        }
        setConfirming(false);
        setEditing(true);
        setSelected("");
        router.refresh();
        setLoading(false);
    }

    if (!editing && currentBuddyId) {
        return (
            <div className="flex flex-col gap-2">
                <p className="text-[13px] text-[var(--text-2)]">
                    <span className="text-[var(--text-4)]">Buddy: </span>
                    <strong className="font-medium text-[var(--text-1)]">{buddy?.fullName ?? "Unknown"}</strong>
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditing(true);
                            setSelected(currentBuddyId);
                            setConfirming(false);
                        }}
                        className="text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
                    >
                        Change
                    </button>
                    {confirming ? (
                        <>
                            <button
                                onClick={handleRemove}
                                disabled={loading}
                                className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors disabled:opacity-40"
                            >
                                {loading ? "Removing…" : "Confirm remove"}
                            </button>
                            <span className="text-[var(--text-4)] text-[12px]">·</span>
                            <button
                                onClick={() => setConfirming(false)}
                                className="text-[12px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleRemove}
                            className="text-[12px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                        >
                            Remove
                        </button>
                    )}
                </div>
                {error && <p className="text-[12px] text-red-600">{error}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 max-w-[480px]">
            <Select
                value={selected}
                onValueChange={setSelected}
                placeholder="— select a member —"
                options={options.map((m) => ({value: m.id, label: m.fullName}))}
            />
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={!selected || loading}>
                    {loading ? "Saving…" : "Set buddy"}
                </Button>
                {currentBuddyId && (
                    <Button size="sm" variant="ghost" onClick={() => {
                        setEditing(false);
                        setSelected(currentBuddyId);
                    }}>
                        Cancel
                    </Button>
                )}
            </div>
            {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>
    );
}
