export const dynamic = "force-dynamic";

import {prisma} from "@/lib/prisma";
import {
  HorizontalTimeline,
  type SerEvent,
  type SerMandate,
  type SerMilestone,
} from "@/components/public/HorizontalTimeline";

export default async function TimelinePage() {
    const [mandates, milestones, events] = await Promise.all([
        prisma.mandate.findMany({
            orderBy: {startsAt: "asc"},
            include: {
                _count: {select: {memberships: true, events: true}},
                memberships: {include: {member: {select: {id: true, slug: true, fullName: true, photoUrl: true}}}},
            },
        }),
        prisma.milestone.findMany({orderBy: {happenedAt: "asc"}}),
        prisma.event.findMany({
            orderBy: {startsAt: "asc"},
            include: {_count: {select: {participations: true}}},
        }),
    ]);

    const serMandates: SerMandate[] = mandates.map((m) => ({
        id: m.id,
        name: m.name,
        academicYear: m.academicYear,
        colorIndex: m.colorIndex,
        customColor: m.customColor,
        startsAt: m.startsAt.toISOString(),
        endsAt: m.endsAt?.toISOString() ?? null,
        _count: m._count,
        members: m.memberships.map(ms => ({
            id: ms.member.id,
            slug: ms.member.slug,
            fullName: ms.member.fullName,
            photoUrl: ms.member.photoUrl,
        })),
    }));

    const serMilestones: SerMilestone[] = milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        happenedAt: m.happenedAt.toISOString(),
        type: m.type,
    }));

    const serEvents: SerEvent[] = events.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        locationName: e.locationName,
        scope: e.scope,
        eventType: e.eventType,
        _count: e._count,
    }));

    return (
        <HorizontalTimeline
            mandates={serMandates}
            milestones={serMilestones}
            events={serEvents}
        />
    );
}
