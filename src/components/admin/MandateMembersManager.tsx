"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Combobox} from "@/components/ui/Combobox";
import {addMemberToMandate, removeMemberFromMandate, reorderMandateMemberships, updateMandateMembership, type RoleEntry} from "@/actions/mandates";

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

function RoleRows({value, onChange}: {value: RoleEntry[]; onChange: (v: RoleEntry[]) => void}) {
    function update(i: number, field: keyof RoleEntry, v: string) {
        onChange(value.map((r, idx) => idx === i ? {...r, [field]: v} : r));
    }
    function remove(i: number) {
        const next = value.filter((_, idx) => idx !== i);
        onChange(next.length ? next : [{department: "", roleTitle: ""}]);
    }
    return (
        <div className="flex flex-col gap-1.5">
            {value.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input value={row.department} onChange={(e) => update(i, "department", e.target.value)} placeholder="Department" className={inputBase}/>
                    <input value={row.roleTitle} onChange={(e) => update(i, "roleTitle", e.target.value)} placeholder="Role title" className={inputBase}/>
                    {value.length > 1 && (
                        <button onClick={() => remove(i)} className="shrink-0 text-[var(--text-4)] hover:text-red-500 transition-colors text-[16px] leading-none px-1" aria-label="Remove">×</button>
                    )}
                </div>
            ))}
            <button onClick={() => onChange([...value, {department: "", roleTitle: ""}])} className="self-start text-[11px] text-[var(--accent)] hover:opacity-70 transition-opacity mt-0.5">
                + Add role
            </button>
        </div>
    );
}

export function MandateMembersManager({mandateId, memberships, allMembers}: Props) {
    const router = useRouter();
    const [items, setItems] = useState(memberships);
    const [adding, setAdding] = useState(false);
    const [memberId, setMemberId] = useState("");
    const [roles, setRoles] = useState<RoleEntry[]>([{department: "", roleTitle: ""}]);
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRoles, setEditRoles] = useState<RoleEntry[]>([]);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [editError, setEditError] = useState("");

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
        const result = await addMemberToMandate(mandateId, memberId, roles);
        if (!result.success) { setError(result.error); setLoading(false); return; }
        setAdding(false);
        setMemberId("");
        setRoles([{department: "", roleTitle: ""}]);
        router.refresh();
        setLoading(false);
    }

    function startEdit(ms: Membership) {
        const roles: RoleEntry[] = ms.departments.length > 0
            ? ms.departments.map((dept, i) => ({department: dept, roleTitle: ms.roleTitles[i] ?? ""}))
            : [{department: "", roleTitle: ms.roleTitles[0] ?? ""}];
        setEditingId(ms.id);
        setEditRoles(roles);
        setEditError("");
    }

    async function handleSave(ms: Membership) {
        setSavingId(ms.id);
        setEditError("");
        const result = await updateMandateMembership(ms.id, editRoles);
        if (!result.success) {
            setEditError(result.error);
            setSavingId(null);
            return;
        }
        setItems(prev => prev.map(item =>
            item.id === ms.id
                ? {
                    ...item,
                    departments: editRoles.map(r => r.department).filter(Boolean),
                    roleTitles: editRoles.map(r => r.roleTitle).filter(Boolean),
                }
                : item
        ));
        setEditingId(null);
        setSavingId(null);
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
                            draggable={editingId !== ms.id}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index, ms.id)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className={[
                                "py-2.5 border-b border-[var(--border)] last:border-0 transition-colors",
                                dragOverId === ms.id && dragItem.current !== index
                                    ? "bg-[var(--surface-raised)]"
                                    : "",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-3">
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
                                    {editingId !== ms.id && (
                                        <p className="text-[11px] text-[var(--text-4)]">
                                            {ms.departments.length > 0
                                                ? ms.departments.map((d, i) => [d, ms.roleTitles[i]].filter(Boolean).join(" · ")).join("  /  ")
                                                : ms.roleTitles.join(" · ")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    {editingId !== ms.id && (
                                        <button
                                            onClick={() => startEdit(ms)}
                                            className="text-[11px] text-[var(--text-4)] hover:text-[var(--accent)] transition-colors"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemove(ms.id)}
                                        disabled={removingId === ms.id}
                                        className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors disabled:opacity-40"
                                    >
                                        {removingId === ms.id ? "…" : "Remove"}
                                    </button>
                                </div>
                            </div>
                            {editingId === ms.id && (
                                <div className="mt-2 flex flex-col gap-2 pl-5">
                                    <RoleRows value={editRoles} onChange={setEditRoles}/>
                                    {editError && <p className="text-[12px] text-red-600">{editError}</p>}
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleSave(ms)} disabled={savingId === ms.id}>
                                            {savingId === ms.id ? "Saving…" : "Save"}
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditError(""); }}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add form */}
            {adding ? (
                <div className="flex flex-col gap-3 pt-2">
                    <Combobox
                        value={memberId}
                        onValueChange={setMemberId}
                        placeholder="— search member —"
                        options={available.map((m) => ({value: m.id, label: m.fullName}))}
                    />
                    <RoleRows value={roles} onChange={setRoles}/>
                    {error && <p className="text-[12px] text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={loading}>
                            {loading ? "Adding…" : "Add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setError(""); setRoles([{department: "", roleTitle: ""}]); }}>
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
