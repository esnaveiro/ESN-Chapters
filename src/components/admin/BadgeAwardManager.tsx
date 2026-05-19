"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
import {Select} from "@/components/ui/Select";
import {awardBadge, revokeBadge} from "@/actions/badges";

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

type MemberBadge = {
    id: string;
    awardedAt: Date;
    member: { id: string; slug: string; fullName: string };
};

type Props = {
    badgeId: string;
    memberBadges: MemberBadge[];
    members: { id: string; fullName: string }[];
};

export function BadgeAwardManager({badgeId, memberBadges, members}: Props) {
    const router = useRouter();
    const [awardMemberId, setAwardMemberId] = useState("");
    const [awardDate, setAwardDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAward() {
        if (!awardMemberId) {
            setError("Select a member");
            return;
        }
        setLoading(true);
        setError("");
        const result = await awardBadge(awardMemberId, badgeId, awardDate);
        if (!result.success) {
            setError(result.error);
            setLoading(false);
            return;
        }
        setAwardMemberId("");
        router.refresh();
        setLoading(false);
    }

    async function handleRevoke(memberBadgeId: string, memberSlug: string) {
        await revokeBadge(memberBadgeId, memberSlug);
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Award form */}
            <div className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_1fr] gap-2">
                    <Select
                        value={awardMemberId}
                        onValueChange={setAwardMemberId}
                        placeholder="— select member —"
                        options={members.map((m) => ({value: m.id, label: m.fullName}))}
                    />
                    <input
                        type="date"
                        value={awardDate}
                        onChange={(e) => setAwardDate(e.target.value)}
                        className={inputBase}
                    />
                </div>
                {error && <p className="text-[12px] text-red-600">{error}</p>}
                <div>
                    <Button size="sm" onClick={handleAward} disabled={loading}>
                        {loading ? "Awarding…" : "Award badge"}
                    </Button>
                </div>
            </div>

            {/* Recipients */}
            {memberBadges.length > 0 ? (
                <div className="flex flex-col border-t border-[var(--border)]">
                    {memberBadges.map((mb) => (
                        <div key={mb.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--border)]">
                            <p className="flex-1 text-[13px] text-[var(--text-1)]">{mb.member.fullName}</p>
                            <span className="text-[11px] tabular-nums text-[var(--text-4)]">
                {new Date(mb.awardedAt).toLocaleDateString("en-GB")}
              </span>
                            <button
                                onClick={() => handleRevoke(mb.id, mb.member.slug)}
                                className="text-[11px] text-[var(--text-4)] hover:text-red-500 transition-colors"
                            >
                                Revoke
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[12px] text-[var(--text-4)]">Not yet awarded to anyone.</p>
            )}
        </div>
    );
}
