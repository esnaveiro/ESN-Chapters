"use client";

import {useState, useTransition} from "react";
import {addTribute, deleteTribute} from "@/actions/members";
import {Select} from "@/components/ui/Select";
import {Button} from "@/components/ui/Button";

type MemberOption = { id: string; fullName: string };

type Tribute = {
    id: string;
    message: string;
    createdAt: Date;
    author: { id: string; fullName: string };
};

type Props = {
    recipientId: string;
    tributes: Tribute[];
    allMembers: MemberOption[];
};

export function TributeManager({recipientId, tributes, allMembers}: Props) {
    const [authorId, setAuthorId] = useState("");
    const [message, setMessage] = useState("");
    const [date, setDate] = useState("");
    const [error, setError] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleAdd() {
        if (!authorId) { setError("Select an author."); return; }
        if (!message.trim()) { setError("Message cannot be empty."); return; }
        setError("");
        startTransition(async () => {
            const result = await addTribute(authorId, recipientId, message.trim(), date || undefined);
            if (result.success) {
                setAuthorId("");
                setMessage("");
                setDate("");
            } else {
                setError(result.error ?? "Failed to add tribute.");
            }
        });
    }

    function handleDelete(tributeId: string) {
        if (confirmDeleteId !== tributeId) { setConfirmDeleteId(tributeId); return; }
        startTransition(async () => {
            await deleteTribute(tributeId, recipientId);
            setConfirmDeleteId(null);
        });
    }

    const authorOptions = allMembers.map((m) => ({value: m.id, label: m.fullName}));

    return (
        <div>
            {/* Existing tributes */}
            {tributes.length > 0 && (
                <div className="mb-6">
                    {tributes.map((t) => (
                        <div key={t.id} className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold text-[var(--text-2)] mb-0.5">{t.author.fullName}</p>
                                <p className="text-[13px] text-[var(--text-1)] leading-snug">{t.message}</p>
                                <p className="text-[11px] text-[var(--text-4)] mt-1 tabular-nums">
                                    {new Date(t.createdAt).toLocaleDateString("en-GB")}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(t.id)}
                                disabled={isPending}
                                className={[
                                    "text-[11px] shrink-0 transition-colors pt-0.5",
                                    confirmDeleteId === t.id
                                        ? "text-red-500 hover:text-red-600 font-medium"
                                        : "text-[var(--text-4)] hover:text-[var(--text-2)]",
                                ].join(" ")}
                            >
                                {confirmDeleteId === t.id ? "Confirm" : "Delete"}
                            </button>
                            {confirmDeleteId === t.id && (
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-[11px] text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors shrink-0 pt-0.5"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add form */}
            <div className="flex flex-col gap-3">
                <Select
                    value={authorId}
                    onValueChange={setAuthorId}
                    options={authorOptions}
                    placeholder="Author…"
                />
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a tribute…"
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                />
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                    {error ? (
                        <p className="text-[12px] text-red-500 flex-1">{error}</p>
                    ) : (
                        <p className="text-[11px] text-[var(--text-4)] flex-1">{message.length}/500</p>
                    )}
                    <Button size="sm" variant="secondary" onClick={handleAdd} disabled={isPending}>
                        Add tribute
                    </Button>
                </div>
            </div>
        </div>
    );
}
