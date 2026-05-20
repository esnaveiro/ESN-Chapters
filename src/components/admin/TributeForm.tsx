"use client";

import {useState, useTransition} from "react";
import {addTribute} from "@/actions/members";
import {Select} from "@/components/ui/Select";
import {Button} from "@/components/ui/Button";

type MemberOption = { id: string; fullName: string };

type Props = {
    allMembers: MemberOption[];
};

export function TributeForm({allMembers}: Props) {
    const [authorId, setAuthorId] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [message, setMessage] = useState("");
    const [date, setDate] = useState("");
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();

    const options = allMembers.map((m) => ({value: m.id, label: m.fullName}));

    function handleAdd() {
        if (!authorId) { setError("Select a from member."); return; }
        if (!recipientId) { setError("Select a to member."); return; }
        if (authorId === recipientId) { setError("Author and recipient must be different."); return; }
        if (!message.trim()) { setError("Message cannot be empty."); return; }
        setError("");
        startTransition(async () => {
            const result = await addTribute(authorId, recipientId, message.trim(), date || undefined);
            if (result.success) {
                setAuthorId("");
                setRecipientId("");
                setMessage("");
                setDate("");
            } else {
                setError(result.error ?? "Failed to add tribute.");
            }
        });
    }

    return (
        <div className="border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-10">
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-4">
                Add tribute
            </p>
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        value={authorId}
                        onValueChange={setAuthorId}
                        options={options}
                        placeholder="From…"
                    />
                    <Select
                        value={recipientId}
                        onValueChange={setRecipientId}
                        options={options}
                        placeholder="To…"
                    />
                </div>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tribute…"
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                />
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)] transition-colors"
                    />
                    <span className="text-[11px] text-[var(--text-4)] flex-1">
                        {date ? "" : "Leave date blank to use today"}
                    </span>
                    {error && <p className="text-[12px] text-red-500">{error}</p>}
                    <Button size="sm" variant="secondary" onClick={handleAdd} disabled={isPending}>
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}
