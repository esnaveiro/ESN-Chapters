export const dynamic = "force-dynamic";

import {prisma} from "@/lib/prisma";
import {getMandateColor} from "@/lib/utils";
import {type BuddyConn, BuddyGraph, type YearBand} from "@/components/public/BuddyGraph";

export default async function NetworkPage() {
    const [members, mandates, rawLinks] = await Promise.all([
        prisma.member.findMany({
            include: {statusHistory: {orderBy: {startedAt: "asc"}, take: 1}},
            orderBy: {joinedAt: "asc"},
        }),
        prisma.mandate.findMany({orderBy: {startsAt: "asc"}}),
        prisma.buddyLink.findMany({select: {buddyId: true, newbieId: true}}),
    ]);

    /* Group members by academic year + semester */
    const bandMap = new Map<string, typeof members>();
    for (const m of members) {
        const yr = toAcademicYear(m.joinedAt);
        const sem = m.statusHistory[0]?.semester ?? 1;
        const key = `${yr}__${sem}`;
        if (!bandMap.has(key)) bandMap.set(key, []);
        bandMap.get(key)!.push(m);
    }

    /* Mandate color by academic year */
    const mandateColors = new Map(mandates.map(m => [m.academicYear, {
        colorIndex: m.colorIndex,
        customColor: m.customColor,
    }]));

    /* Sort: by year then semester */
    const keys = [...bandMap.keys()].sort((a, b) => {
        const [aYr, aSem] = a.split("__");
        const [bYr, bSem] = b.split("__");
        return aYr !== bYr ? aYr.localeCompare(bYr) : Number(aSem) - Number(bSem);
    });

    const yearBands: YearBand[] = keys.map((key, idx) => {
        const [yr, semStr] = key.split("__");
        const sem = Number(semStr) as 1 | 2;
        const mc = mandateColors.get(yr);
        return {
            academicYear: yr,
            semester: sem,
            color: getMandateColor(mc?.colorIndex ?? idx, mc?.customColor),
            members: bandMap.get(key)!.map(m => ({
                id: m.id,
                slug: m.slug,
                fullName: m.fullName,
                photoUrl: m.photoUrl,
                status: m.statusHistory[0]?.status ?? ("NEWBIE" as const),
                joinedAt: m.joinedAt,
                bio: m.bio,
                favouriteMemory: m.favouriteMemory,
            })),
        };
    });

    const buddyLinks: BuddyConn[] = rawLinks.map(l => ({
        buddyId: l.buddyId,
        newbieId: l.newbieId,
    }));

    if (yearBands.length === 0) return (
        <div style={{height: "calc(100dvh - 112px)", display: "flex", alignItems: "center", justifyContent: "center"}}
             className="md:h-[calc(100dvh-56px)]">
            <p style={{fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-4)"}}>
                No members yet
            </p>
        </div>
    );

    return <BuddyGraph yearBands={yearBands} buddyLinks={buddyLinks}/>;
}

function toAcademicYear(date: Date): string {
    const month = date.getMonth();
    const year = date.getFullYear();
    return month >= 8
        ? `${year}/${String(year + 1).slice(2)}`
        : `${year - 1}/${String(year).slice(2)}`;
}
