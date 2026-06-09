"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Combobox} from "@/components/ui/Combobox";
import {addMemberToMandate, removeMemberFromMandate, updateMandateMembership, type RoleEntry} from "@/actions/mandates";

type Membership = {
    id: string;
    departments: string[];
    roleTitles: string[];
    mandate: {id: string; academicYear: string; name: string};
};

type Props = {
    memberId: string;
    memberships: Membership[];
    allMandates: {id: string; academicYear: string; name: string}[];
};

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

function zipRoles(departments: string[], roleTitles: string[]): RoleEntry[] {
    const len = Math.max(departments.length, roleTitles.length, 1);
    return Array.from({length: len}, (_, i) => ({
        department: departments[i] ?? "",
        roleTitle: roleTitles[i] ?? "",
    }));
}

function RoleRows({
    value,
    onChange,
}: {
    value: RoleEntry[];
    onChange: (v: RoleEntry[]) => void;
}) {
    function update(i: number, field: keyof RoleEntry, v: string) {
        const next = value.map((r, idx) => idx === i ? {...r, [field]: v} : r);
        onChange(next);
    }
    function remove(i: number) {
        const next = value.filter((_, idx) => idx !== i);
        onChange(next.length ? next : [{department: "", roleTitle: ""}]);
    }
    function add() {
        onChange([...value, {department: "", roleTitle: ""}]);
    }

    return (
        <div className="flex flex-col gap-1.5">
            {value.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <input
                        value={row.department}
                        onChange={(e) => update(i, "department", e.target.value)}
                        placeholder="Department"
                        className={inputBase}
                    />
                    <input
                        value={row.roleTitle}
                        onChange={(e) => update(i, "roleTitle", e.target.value)}
                        placeholder="Role title"
                        className={inputBase}
                    />
                    {value.length > 1 && (
                        <button
                            onClick={() => remove(i)}
                            className="shrink-0 text-[var(--text-4)] hover:text-red-500 transition-colors text-[16px] leading-none px-1"
                            aria-label="Remove row"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
            <button
                onClick={add}
                className="self-start text-[11px] text-[var(--accent)] hover:opacity-70 transition-opacity mt-0.5"
            >
                + Add role
            </button>
        </div>
    );
}

type RowState = {roles: RoleEntry[]; saving: boolean; saved: boolean};

export function MemberMandatesManager({memberId, memberships, allMandates}: Props) {
    const router = useRouter();

    const [rows, setRows] = useState<Record<string, RowState>>(() =>
        Object.fromEntries(
            memberships.map((ms) => [
                ms.id,
                {roles: zipRoles(ms.departments, ms.roleTitles), saving: false, saved: false},
            ])
        )
    );
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [newMandateId, setNewMandateId] = useState("");
    const [newRoles, setNewRoles] = useState<RoleEntry[]>([{department: "", roleTitle: ""}]);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    function setRow(id: string, patch: Partial<RowState>) {
        setRows((prev) => ({...prev, [id]: {...prev[id], ...patch}}));
    }

    const available = allMandates.filter((m) => !memberships.some((ms) => ms.mandate.id === m.id));

    async function handleSaveRow(id: string) {
        const row = rows[id];
        if (!row) return;
        setRow(id, {saving: true, saved: false});
        const result = await updateMandateMembership(id, row.roles);
        if (result.success) {
            setRow(id, {saving: false, saved: true});
            setTimeout(() => setRow(id, {saved: false}), 2000);
        } else {
            setRow(id, {saving: false});
        }
    }

    async function handleRemove(ms: Membership) {
        setRemovingId(ms.id);
        await removeMemberFromMandate(ms.id, ms.mandate.id);
        router.refresh();
        setRemovingId(null);
    }

    async function handleAdd() {
        if (!newMandateId) {setAddError("Select a mandate"); return;}
        setAddLoading(true);
        setAddError("");
        const result = await addMemberToMandate(newMandateId, memberId, newRoles);
        if (!result.success) {setAddError(result.error); setAddLoading(false); return;}
        setAdding(false);
        setNewMandateId("");
        setNewRoles([{department: "", roleTitle: ""}]);
        router.refresh();
        setAddLoading(false);
    }

    return (
        <div>
            {memberships.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] mb-4">Not assigned to any mandates yet.</p>
            ) : (
                <div className="flex flex-col gap-4 mb-5">
                    {memberships.map((ms) => {
                        const row = rows[ms.id] ?? {roles: [{department: "", roleTitle: ""}], saving: false, saved: false};
                        return (
                            <div key={ms.id} className="border border-[var(--border)] rounded-[var(--radius-md)] p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <span className="text-[12px] font-semibold text-[var(--text-1)]">
                                            {ms.mandate.academicYear}
                                        </span>
                                        <span className="ml-2 text-[11px] text-[var(--text-4)]">
                                            {ms.mandate.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(ms)}
                                        disabled={removingId === ms.id}
                                        className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors disabled:opacity-40"
                                    >
                                        {removingId === ms.id ? "…" : "Remove"}
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2 mb-0.5">
                                        <p className="flex-1 text-[10px] font-medium text-[var(--text-4)] uppercase tracking-[0.08em]">Department</p>
                                        <p className="flex-1 text-[10px] font-medium text-[var(--text-4)] uppercase tracking-[0.08em]">Role title</p>
                                        <div className="w-5 shrink-0"/>
                                    </div>
                                    <RoleRows
                                        value={row.roles}
                                        onChange={(roles) => setRow(ms.id, {roles, saved: false})}
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button size="sm" onClick={() => handleSaveRow(ms.id)} disabled={row.saving}>
                                            {row.saving ? "Saving…" : "Save"}
                                        </Button>
                                        {row.saved && (
                                            <span className="text-[11px] text-[var(--text-4)]">Saved</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {adding ? (
                <div className="flex flex-col gap-3 border border-[var(--border)] rounded-[var(--radius-md)] p-4">
                    <Combobox
                        value={newMandateId}
                        onValueChange={setNewMandateId}
                        placeholder="— select mandate —"
                        options={available.map((m) => ({value: m.id, label: `${m.academicYear} — ${m.name}`}))}
                    />
                    <div className="flex gap-2 mb-0.5">
                        <p className="flex-1 text-[10px] font-medium text-[var(--text-4)] uppercase tracking-[0.08em]">Department</p>
                        <p className="flex-1 text-[10px] font-medium text-[var(--text-4)] uppercase tracking-[0.08em]">Role title</p>
                        <div className="w-5 shrink-0"/>
                    </div>
                    <RoleRows value={newRoles} onChange={setNewRoles}/>
                    {addError && <p className="text-[12px] text-red-600">{addError}</p>}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={addLoading}>
                            {addLoading ? "Adding…" : "Add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {setAdding(false); setAddError(""); setNewRoles([{department: "", roleTitle: ""}]);}}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)} disabled={available.length === 0}>
                    {available.length === 0 ? "In all mandates" : "Add to mandate"}
                </Button>
            )}
        </div>
    );
}
