"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {addMemberToMandate, removeMemberFromMandate, reorderMandateMemberships} from "@/actions/mandates";

type Membership = {
    id: string;
    departments: string[];
    roleTitles: string[];
    member: { id: string; fullName: string };
};

type Props = {
    mandateId: string;
    memberships: Membership[];
    allMembers: { id: string; fullName: string }[];
};

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

export function MandateMembersManager({mandateId, memberships, allMembers}: Props) {
    const router = useRouter();
    const [items, setItems] = useState(memberships);
    const [adding, setAdding] = useState(false);
    const [memberId, setMemberId] = useState("");
    const [department, setDepartment] = useState("");
    const [roleTitle, setRoleTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => { setItems(memberships); }, [memberships]);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    const available = allMembers.filter(
        (m) => !items.some((ms) => ms.member.id === m.id),
    );

    async function handleAdd() {
        if (!memberId) { setError("Select a member"); return; }
        setLoading(true);
        setError("");
        const result = await addMemberToMandate(mandateId, memberId, department, roleTitle);
        if (!result.success) { setError(result.error); setLoading(false); return; }
        setAdding(false);
        setMemberId("");
        setDepartment("");
        setRoleTitle("");
        router.refresh();
        setLoading(false);
    }

    async function handleRemove(membershipId: string) {
        setRemovingId(membershipId);
        await removeMemberFromMandate(membershipId, mandateId);
        setItems(prev => prev.filter(ms => ms.id !== membershipId));
        setRemovingId(null);
    }

    function handleDragStart(index: number) {
        dragItem.current = index;
    }

    function handleDragEnter(index: number, id: string) {
        dragOverItem.current = index;
        setDragOverId(id);
    }

    async function handleDrop() {
        const from = dragItem.current;
        const to = dragOverItem.current;
        if (from === null || to === null || from === to) {
            dragItem.current = null;
            dragOverItem.current = null;
            setDragOverId(null);
            return;
        }
        const reordered = [...items];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        setItems(reordered);
        dragItem.current = null;
        dragOverItem.current = null;
        setDragOverId(null);
        await reorderMandateMemberships(mandateId, reordered.map(ms => ms.id));
    }

    return (
        <div>
            {/* Member list */}
            {items.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] mb-4">No members assigned yet.</p>
            ) : (
                <div className="mb-5 overflow-y-auto max-h-[420px] pr-3">
                    {items.map((ms, index) => (
                        <div
                            key={ms.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index, ms.id)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className={[
                                "flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0 transition-colors",
                                dragOverId === ms.id && dragItem.current !== index
                                    ? "bg-[var(--surface-raised)]"
                                    : "",
                            ].join(" ")}
                        >
                            {/* Drag handle */}
                            <div
                                className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                                title="Drag to reorder"
                            >
                                <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                                    <circle cx="4" cy="3" r="1.5"/>
                                    <circle cx="8" cy="3" r="1.5"/>
                                    <circle cx="4" cy="8" r="1.5"/>
                                    <circle cx="8" cy="8" r="1.5"/>
                                    <circle cx="4" cy="13" r="1.5"/>
                                    <circle cx="8" cy="13" r="1.5"/>
                                </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[var(--text-1)] truncate">
                                    {ms.member.fullName}
                                </p>
                                <p className="text-[11px] text-[var(--text-4)]">
                                    {[...ms.roleTitles, ...ms.departments].join(" · ")}
                                </p>
                            </div>
                            <button
                                onClick={() => handleRemove(ms.id)}
                                disabled={removingId === ms.id}
                                className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors shrink-0 disabled:opacity-40"
                            >
                                {removingId === ms.id ? "…" : "Remove"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add form */}
            {adding ? (
                <div className="flex flex-col gap-3 pt-2">
                    <Select
                        value={memberId}
                        onValueChange={setMemberId}
                        placeholder="— select member —"
                        options={available.map((m) => ({value: m.id, label: m.fullName}))}
                    />
                    <input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Departments — comma-separated (e.g. Board, Cultural)"
                        className={inputBase}
                    />
                    <input
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="Roles — comma-separated (e.g. IT Manager, Cultural Coordinator)"
                        className={inputBase}
                    />
                    {error && <p className="text-[12px] text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={loading}>
                            {loading ? "Adding…" : "Add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setError(""); }}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                    Add member
                </Button>
            )}
        </div>
    );
}
