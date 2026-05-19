export const dynamic = "force-dynamic";

import {prisma} from "@/lib/prisma";
import {getMandateColor} from "@/lib/utils";
import {type BuddyConn, BuddyGraph, type YearBand} from "@/components/public/BuddyGraph";

export default async function GraphPage() {
    const [members, mandates, rawLinks] = await Promise.all([
        prisma.member.findMany({
            include: {statusHistory: {where: {endedAt: null}}},
            orderBy: {joinedAt: "asc"},
        }),
        prisma.mandate.findMany({orderBy: {startsAt: "asc"}}),
        prisma.buddyLink.findMany({select: {buddyId: true, newbieId: true}}),
    ]);

    /* Group members by academic year (Sep–Aug) */
    const yearMap = new Map<string, typeof members>();
    for (const m of members) {
        const yr = toAcademicYear(m.joinedAt);
        if (!yearMap.has(yr)) yearMap.set(yr, []);
        yearMap.get(yr)!.push(m);
    }

    /* Mandate color by academic year */
    const mandateColors = new Map(mandates.map(m => [m.academicYear, {
        colorIndex: m.colorIndex,
        customColor: m.customColor
    }]));

    const years = [...yearMap.keys()].sort();

    const yearBands: YearBand[] = years.map((yr, idx) => {
        const mc = mandateColors.get(yr);
        return {
            academicYear: yr,
            color: getMandateColor(mc?.colorIndex ?? idx, mc?.customColor),
            members: yearMap.get(yr)!.map(m => ({
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

    return (
        <div style={{height: "calc(100dvh - 56px)"}}>
            {yearBands.length === 0 ? (
                <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <p style={{
                        fontSize: 13,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--text-4)"
                    }}>
                        No members yet
                    </p>
                </div>
            ) : (
                <BuddyGraph yearBands={yearBands} buddyLinks={buddyLinks}/>
            )}
        </div>
    );
}

function toAcademicYear(date: Date): string {
    const month = date.getMonth(); // 0 = Jan, 8 = Sep
    const year = date.getFullYear();
    return month >= 8
        ? `${year}/${String(year + 1).slice(2)}`
        : `${year - 1}/${String(year).slice(2)}`;
}
