import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {MemberEditClient} from "@/components/admin/MemberEditClient";
import {MemberStatus} from "@/generated/prisma/enums";

export default async function EditMemberPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;

    const [member, allMembers] = await Promise.all([
        prisma.member.findUnique({
            where: {id},
            include: {
                statusHistory: {orderBy: {startedAt: "asc"}},
                buddyLinksAsNewbie: true,
                buddyLinksAsBuddy: {include: {newbie: {select: {id: true, fullName: true}}}},
                tributesReceived: {
                    orderBy: {createdAt: "desc"},
                    include: {author: {select: {id: true, fullName: true}}},
                },
            },
        }),
        prisma.member.findMany({orderBy: {fullName: "asc"}, select: {id: true, fullName: true}}),
    ]);

    if (!member) notFound();

    const currentStatus = member.statusHistory.find((s) => !s.endedAt)?.status ?? ("NEWBIE" as MemberStatus);

    return (
        <MemberEditClient
            member={{
                id: member.id,
                slug: member.slug,
                fullName: member.fullName,
                bio: member.bio,
                favouriteMemory: member.favouriteMemory,
                linkedinUrl: member.linkedinUrl,
                photoUrl: member.photoUrl,
                joinedAt: member.joinedAt.toISOString().substring(0, 7),
                currentStatus,
                statusHistory: member.statusHistory.map((sh) => ({
                    status: sh.status,
                    startedAt: sh.startedAt.toISOString().substring(0, 7),
                    semester: sh.semester,
                })),
                buddyId: member.buddyLinksAsNewbie[0]?.buddyId,
                currentNewbies: member.buddyLinksAsBuddy.map((l) => ({
                    id: l.newbieId,
                    fullName: l.newbie.fullName,
                })),
                tributes: member.tributesReceived.map((t) => ({
                    id: t.id,
                    message: t.message,
                    createdAt: t.createdAt,
                    author: t.author,
                })),
            }}
            allMembers={allMembers}
        />
    );
}
