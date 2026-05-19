"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {addMemberToMandate, removeMemberFromMandate} from "@/actions/mandates";

type Membership = {
    id: string;
    department: string;
    roleTitle: string;
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
    const [adding, setAdding] = useState(false);
    const [memberId, setMemberId] = useState("");
    const [department, setDepartment] = useState("");
    const [roleTitle, setRoleTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const available = allMembers.filter(
        (m) => !memberships.some((ms) => ms.member.id === m.id),
    );

    async function handleAdd() {
        if (!memberId) {
            setError("Select a member");
            return;
        }
        setLoading(true);
        setError("");
        const result = await addMemberToMandate(mandateId, memberId, department, roleTitle);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
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
        router.refresh();
        setRemovingId(null);
    }

    return (
        <div>
            {/* Member list */}
            {memberships.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] mb-4">No members assigned yet.</p>
            ) : (
                <div className="mb-5">
                    {memberships.map((ms) => (
                        <div
                            key={ms.id}
                            className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-[var(--text-1)] truncate">
                                    {ms.member.fullName}
                                </p>
                                <p className="text-[11px] text-[var(--text-4)]">
                                    {ms.roleTitle} · {ms.department}
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
                        placeholder="Department (e.g. IT, HR, Events) — optional"
                        className={inputBase}
                    />
                    <input
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        placeholder="Role title (e.g. IT Manager, Member) — optional"
                        className={inputBase}
                    />
                    {error && <p className="text-[12px] text-red-600">{error}</p>}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={loading}>
                            {loading ? "Adding…" : "Add"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                            setAdding(false);
                            setError("");
                        }}>
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
