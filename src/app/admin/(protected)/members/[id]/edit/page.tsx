import {notFound} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {MemberEditClient} from "@/components/admin/MemberEditClient";
import {latestStatus} from "@/lib/utils";

export default async function EditMemberPage({params}: { params: Promise<{ id: string }> }) {
    const {id} = await params;

    const [member, allMembers, allMandates, allEvents, allMilestones] = await Promise.all([
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
                mandateMemberships: {
                    include: {mandate: {select: {id: true, academicYear: true, name: true}}},
                    orderBy: [{mandate: {startsAt: "asc"}}, {sortOrder: "asc"}],
                },
                eventParticipations: {
                    include: {event: {select: {id: true, title: true, startsAt: true, showOnTimeline: true}}},
                    orderBy: {event: {startsAt: "desc"}},
                },
                milestoneMembers: {
                    include: {milestone: {select: {id: true, title: true, happenedAt: true, type: true}}},
                    orderBy: {milestone: {happenedAt: "desc"}},
                },
            },
        }),
        prisma.member.findMany({orderBy: {fullName: "asc"}, select: {id: true, fullName: true}}),
        prisma.mandate.findMany({orderBy: {startsAt: "desc"}, select: {id: true, academicYear: true, name: true}}),
        prisma.event.findMany({
            orderBy: {startsAt: "desc"},
            select: {id: true, title: true, startsAt: true, showOnTimeline: true},
        }),
        prisma.milestone.findMany({
            orderBy: {happenedAt: "desc"},
            select: {id: true, title: true, happenedAt: true, type: true},
        }),
    ]);

    if (!member) notFound();

    const currentStatus = latestStatus(member.statusHistory);

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
        allMandates={allMandates}
        mandateMemberships={member.mandateMemberships.map((ms) => ({
            id: ms.id,
            departments: ms.departments,
            roleTitles: ms.roleTitles,
            mandate: ms.mandate,
        }))}
        allEvents={allEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startsAt: e.startsAt.toISOString(),
            showOnTimeline: e.showOnTimeline,
        }))}
        eventParticipations={member.eventParticipations.map((p) => ({
            id: p.id,
            role: p.role,
            event: {
                id: p.event.id,
                title: p.event.title,
                startsAt: p.event.startsAt.toISOString(),
                showOnTimeline: p.event.showOnTimeline,
            },
        }))}
        allMilestones={allMilestones.map((m) => ({
            id: m.id,
            title: m.title,
            happenedAt: m.happenedAt.toISOString(),
            type: m.type,
        }))}
        milestoneLinks={member.milestoneMembers.map((l) => ({
            id: l.id,
            milestone: {
                id: l.milestone.id,
                title: l.milestone.title,
                happenedAt: l.milestone.happenedAt.toISOString(),
                type: l.milestone.type,
            },
        }))}
        />
    );
}
