import {notFound} from "next/navigation";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {MemberForm} from "@/components/admin/MemberForm";
import {BuddySelector} from "@/components/admin/BuddySelector";
import {NewbiesManager} from "@/components/admin/NewbiesManager";
import {StatusHistoryManager} from "@/components/admin/StatusHistoryManager";
import {StatusBadge} from "@/components/ui/Badge";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {TributeManager} from "@/components/admin/TributeManager";
import {deleteMember} from "@/actions/members";
import {MemberStatus} from "@/generated/prisma/enums";

export default async function EditMemberPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [member, allMembers] = await Promise.all([
        prisma.member.findUnique({
            where: {id},
            include: {
                statusHistory: {orderBy: {startedAt: "asc"}},
                buddyLinksAsNewbie: true,
                buddyLinksAsBuddy: {
                    include: {newbie: {select: {id: true, fullName: true}}},
                },
                tributesReceived: {
                    orderBy: {createdAt: "desc"},
                    include: {author: {select: {id: true, fullName: true}}},
                },
            },
        }),
        prisma.member.findMany({
            orderBy: {fullName: "asc"},
            select: {id: true, fullName: true},
        }),
    ]);

    if (!member) notFound();

    const currentStatus =
        member.statusHistory.find((s) => !s.endedAt)?.status ??
        ("NEWBIE" as MemberStatus);
    const buddyId = member.buddyLinksAsNewbie[0]?.buddyId;
    const currentNewbies = member.buddyLinksAsBuddy.map((l) => ({
        id: l.newbieId,
        fullName: l.newbie.fullName,
    }));

    return (
        <div>
            <Link
                href="/admin/members"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Members
            </Link>

            {/* Header */}
            <div className="mb-10 mt-2 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-2">
                        {member.fullName}
                    </h1>
                    <StatusBadge status={currentStatus}/>
                </div>
                <DeleteButton
                    confirmText={`Permanently delete ${member.fullName}? This cannot be undone.`}
                    redirectTo="/admin/members"
                    action={deleteMember.bind(null, member.id)}
                />
            </div>

            {/* Status history */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-4">
                    Status history
                </p>
                <StatusHistoryManager
                    memberId={member.id}
                    initialEntries={member.statusHistory.map((sh) => ({
                        status: sh.status,
                        startedAt: sh.startedAt.toISOString().split("T")[0],
                    }))}
                />
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* Buddy relationships */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Buddy relationships
                </p>

                <div className="flex flex-col gap-8">
                    {/* newbie ← buddy */}
                    <div>
                        <p className="text-[12px] font-medium text-[var(--text-2)] mb-3">My buddy</p>
                        <BuddySelector
                            newbieId={member.id}
                            members={allMembers}
                            currentBuddyId={buddyId}
                        />
                    </div>

                    {/* buddy → newbies */}
                    <div>
                        <p className="text-[12px] font-medium text-[var(--text-2)] mb-3">My newbies</p>
                        <NewbiesManager
                            buddyId={member.id}
                            currentNewbies={currentNewbies}
                            allMembers={allMembers}
                        />
                    </div>
                </div>
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* Tributes */}
            <section className="mb-10">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Tributes
                </p>
                <TributeManager
                    recipientId={member.id}
                    tributes={member.tributesReceived}
                    allMembers={allMembers.filter((m) => m.id !== member.id)}
                />
            </section>

            <div className="border-t border-[var(--border)] mb-10"/>

            {/* Profile details */}
            <section>
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Profile details
                </p>
                <MemberForm
                    mode="edit"
                    memberId={member.id}
                    defaultValues={{
                        fullName: member.fullName,
                        bio: member.bio ?? "",
                        favouriteMemory: member.favouriteMemory ?? "",
                        linkedinUrl: member.linkedinUrl ?? "",
                        joinedAt: member.joinedAt.toISOString(),
                        photoUrl: member.photoUrl ?? "",
                    }}
                />
            </section>
        </div>
    );
}
