"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {MemberStatus} from "@/generated/prisma/enums";
import {Input, Textarea} from "@/components/ui/Input";
import {Button} from "@/components/ui/Button";
import {StatusBadge} from "@/components/ui/Badge";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {PhotoUpload} from "@/components/admin/PhotoUpload";
import {BuddySelector} from "@/components/admin/BuddySelector";
import {NewbiesManager} from "@/components/admin/NewbiesManager";
import {TributeManager} from "@/components/admin/TributeManager";
import {StatusHistoryBuilder} from "@/components/admin/MemberForm";
import {deleteMember, setStatusHistory, StatusEntry, updateMember} from "@/actions/members";

const inputBase =
    "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--text-1)] placeholder-[var(--text-4)] transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-light)]";

type MemberOption = { id: string; fullName: string };
type Tribute = {
    id: string; message: string; createdAt: Date;
    author: { id: string; fullName: string };
};

type Props = {
    member: {
        id: string;
        slug: string;
        fullName: string;
        bio: string | null;
        favouriteMemory: string | null;
        linkedinUrl: string | null;
        photoUrl: string | null;
        joinedAt: string;
        statusHistory: StatusEntry[];
        currentStatus: MemberStatus;
        buddyId: string | undefined;
        currentNewbies: { id: string; fullName: string }[];
        tributes: Tribute[];
    };
    allMembers: MemberOption[];
};

function normalizeUrl(url: string): string {
    if (!url.trim()) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url.trim();
    return `https://${url.trim()}`;
}

export function MemberEditClient({member, allMembers}: Props) {
    const router = useRouter();

    const [photoUrl, setPhotoUrl] = useState(member.photoUrl ?? "");
    const [fullName, setFullName] = useState(member.fullName);
    const [joinedAt, setJoinedAt] = useState(member.joinedAt);
    const [statusHistory, setStatusHistoryState] = useState<StatusEntry[]>(member.statusHistory);
    const [bio, setBio] = useState(member.bio ?? "");
    const [favouriteMemory, setFavouriteMemory] = useState(member.favouriteMemory ?? "");
    const [linkedinUrl, setLinkedinUrl] = useState(member.linkedinUrl ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    async function handleSave() {
        setLoading(true);
        setError("");
        setSaved(false);

        const valid = statusHistory.filter((e) => e.startedAt);
        const [updateResult, historyResult] = await Promise.all([
            updateMember(member.id, {
                fullName,
                bio,
                favouriteMemory,
                linkedinUrl: normalizeUrl(linkedinUrl),
                joinedAt,
                photoUrl,
            }),
            valid.length > 0
                ? setStatusHistory(member.id, valid)
                : Promise.resolve({success: true, data: undefined} as const),
        ]);

        setLoading(false);
        if (!updateResult.success) { setError(updateResult.error); return; }
        if (!historyResult.success) { setError(historyResult.error); return; }
        setSaved(true);
        router.refresh();
    }

    return (
        <div>
            <Link
                href="/admin/members"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Members
            </Link>

            {/* Header */}
            <div className="mb-10 mt-2 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-2">
                        {member.fullName}
                    </h1>
                    <StatusBadge status={member.currentStatus}/>
                </div>
                <DeleteButton
                    confirmText={`Permanently delete ${member.fullName}? This cannot be undone.`}
                    redirectTo="/admin/members"
                    action={deleteMember.bind(null, member.id)}
                />
            </div>

            {/* ── Profile details ─────────────────────────────────── */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Profile details
                </p>
                <div className="space-y-6">
                    <PhotoUpload
                        bucket="member-photos"
                        currentUrl={photoUrl}
                        onUpload={setPhotoUrl}
                        label="Profile photo"
                    />
                    <Input
                        label="Full name"
                        name="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                    <Input
                        label="Join month"
                        name="joinedAt"
                        type="month"
                        value={joinedAt}
                        onChange={(e) => setJoinedAt(e.target.value)}
                        required
                    />
                    <div className="flex flex-col gap-2">
                        <label className="text-[12px] font-medium text-[var(--text-2)]">Status history</label>
                        <StatusHistoryBuilder entries={statusHistory} onChange={setStatusHistoryState}/>
                    </div>
                    <Textarea
                        label="Bio"
                        name="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="A short biography..."
                    />
                    <Textarea
                        label="Favourite memory"
                        name="favouriteMemory"
                        value={favouriteMemory}
                        onChange={(e) => setFavouriteMemory(e.target.value)}
                        placeholder="Their most memorable ESN moment..."
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-[12px] font-medium text-[var(--text-2)]">LinkedIn URL</label>
                        <input
                            type="text"
                            value={linkedinUrl}
                            onChange={(e) => setLinkedinUrl(e.target.value)}
                            placeholder="linkedin.com/in/username"
                            className={inputBase}
                        />
                    </div>
                </div>
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* ── Buddy relationships ──────────────────────────────── */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Buddy relationships
                </p>
                <div className="flex flex-col gap-8">
                    <div>
                        <p className="text-[12px] font-medium text-[var(--text-2)] mb-3">My buddy</p>
                        <BuddySelector
                            newbieId={member.id}
                            members={allMembers}
                            currentBuddyId={member.buddyId}
                        />
                    </div>
                    <div>
                        <p className="text-[12px] font-medium text-[var(--text-2)] mb-3">My newbies</p>
                        <NewbiesManager
                            buddyId={member.id}
                            currentNewbies={member.currentNewbies}
                            allMembers={allMembers}
                        />
                    </div>
                </div>
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* ── Tributes ─────────────────────────────────────────── */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Tributes
                </p>
                <TributeManager
                    recipientId={member.id}
                    tributes={member.tributes}
                    allMembers={allMembers.filter((m) => m.id !== member.id)}
                />
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* ── Save ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 pb-10">
                {error && <p className="text-[12px] text-red-600">{error}</p>}
                {saved && (
                    <div className="flex items-center gap-3 text-[13px]">
                        <span className="text-green-600 font-medium">Saved successfully.</span>
                        <Link
                            href={`/members/${member.slug}`}
                            className="font-semibold text-[var(--accent)] hover:opacity-70 transition-opacity"
                        >
                            View profile →
                        </Link>
                    </div>
                )}
                <div className="flex gap-3">
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving…" : "Save changes"}
                    </Button>
                    <Button variant="secondary" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
