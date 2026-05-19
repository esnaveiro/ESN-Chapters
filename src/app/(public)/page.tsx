export const dynamic = "force-dynamic";

import {prisma} from "@/lib/prisma";
import {HomeFolderStack} from "@/components/public/HomeFolderStack";
import {Reveal} from "@/components/ui/Reveal";
import {APP_TAGLINE, APP_TITLE} from "@/lib/config";

export default async function HomePage() {

    const [memberCount, mandateCount, mandates] = await Promise.all([
        prisma.member.count(),
        prisma.mandate.count(),
        prisma.mandate.findMany({
            orderBy: {startsAt: "desc"},
            take: 7,
            include: {
                memberships: {
                    include: {member: {select: {id: true, slug: true, fullName: true, photoUrl: true}}},
                    orderBy: {roleTitle: "asc"},
                },
            },
        }),
    ]);

    const firstMandate = mandateCount > 0
        ? await prisma.mandate.findFirst({orderBy: {startsAt: "asc"}, select: {startsAt: true}})
        : null;

    const sinceYear = firstMandate ? firstMandate.startsAt.getFullYear() : null;
    const latestMandate = mandates[0] ?? null;
    const pastMandates = mandates.slice(1).map(m => ({
        id: m.id,
        academicYear: m.academicYear,
        colorIndex: m.colorIndex,
        customColor: m.customColor,
        memberships: {length: m.memberships.length},
    }));

    return (
        <div>

            {/* ── Hero ──────────────────────────────────────── */}
            <section
                className="flex flex-col justify-center bg-[var(--bg)]"
                style={{minHeight: "calc(100vh - 80px - 228px)"}}
            >
                <div className="mx-auto w-full px-10 pt-[72px] pb-[52px]" style={{maxWidth: 1100}}>

                    <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--accent)] mb-3">
                        {APP_TITLE}
                    </p>

                    <Reveal delay={0}>
                        <h1 className="text-[clamp(2.8rem,7vw,5.5rem)] font-black tracking-[-0.045em] leading-[0.95] text-[var(--text-1)] max-w-[14ch] mb-5">
                            {APP_TAGLINE}
                        </h1>
                    </Reveal>

                    {/*<Reveal delay={150}>*/}
                    {/*  <p className="text-sm text-[var(--text-3)] tabular-nums">*/}
                    {/*    {memberCount} volunteer{memberCount !== 1 ? "s" : ""}*/}
                    {/*    {mandateCount > 0 && <> &nbsp;·&nbsp; {mandateCount} mandate{mandateCount !== 1 ? "s" : ""}</>}*/}
                    {/*    {sinceYear && <> &nbsp;·&nbsp; est. {sinceYear}</>}*/}
                    {/*  </p>*/}
                    {/*</Reveal>*/}

                </div>
            </section>

            {/* ── Folder stack ──────────────────────────────── */}
            <div className="bg-[var(--bg)] pb-20">
                <HomeFolderStack
                    memberCount={memberCount}
                    mandateCount={mandateCount}
                    sinceYear={sinceYear}
                    latestMandate={latestMandate}
                    pastMandates={pastMandates}
                />
            </div>

        </div>
    );
}
