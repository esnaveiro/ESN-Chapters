export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {latestStatus} from "@/lib/utils";
import {YearbookIndex} from "@/components/public/YearbookIndex";
import {sectionId} from "@/lib/yearbook";

function toAcademicYear(date: Date): string {
    const m = date.getMonth();
    const y = date.getFullYear();
    return m >= 8 ? `${y}/${String(y + 1).slice(2)}` : `${y - 1}/${String(y).slice(2)}`;
}

export default async function AlumniPage() {
    const members = await prisma.member.findMany({
        include: {statusHistory: {orderBy: {startedAt: "asc"}}},
        orderBy: {fullName: "asc"},
    });

    const alumni = members.filter(m => latestStatus(m.statusHistory) === "ALUMNI");

    // Group by academic year they became alumni
    const groups = new Map<string, typeof alumni>();
    for (const m of alumni) {
        const alumniEntry = [...m.statusHistory].reverse().find(h => h.status === "ALUMNI");
        const year = alumniEntry ? toAcademicYear(new Date(alumniEntry.startedAt)) : "Unknown";
        if (!groups.has(year)) groups.set(year, []);
        groups.get(year)!.push(m);
    }

    // Newest class first
    const sortedYears = [...groups.keys()].sort((a, b) => b.localeCompare(a));

    const indexEntries = sortedYears.map((year, idx) => ({
        year,
        color: "var(--text-3)",
        edition: String(sortedYears.length - idx).padStart(2, "0"),
    }));

    return (
        <div className="mx-auto px-5 md:px-10 pt-8 md:pt-[52px] pb-[100px]" style={{maxWidth: 1280}}>

            {/* Page header */}
            {/* <div className="mb-14">
                <div className="flex items-baseline gap-5 mb-4">
                    <h1 className="text-[clamp(2.8rem,7vw,6rem)] font-black tracking-[-0.05em] leading-none text-[var(--text-1)]">
                        Alumni
                    </h1>
                    <span className="text-xs font-semibold text-[var(--text-4)] tracking-[0.06em] uppercase">
                        {alumni.length} member{alumni.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="h-px bg-[var(--border)]"/>
            </div> */}

            {alumni.length === 0 && (
                <div className="py-24 text-center">
                    <p className="text-[13px] text-[var(--text-4)] tracking-[0.1em] uppercase">No alumni yet</p>
                </div>
            )}

            <div className="flex gap-14">
                <div className="hidden md:block">
                    <YearbookIndex entries={indexEntries}/>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-[88px]">
                    {sortedYears.map((year, idx) => {
                        const group = groups.get(year)!;
                        const edition = String(sortedYears.length - idx).padStart(2, "0");

                        return (
                            <section
                                key={year}
                                id={sectionId(year)}
                                className="scroll-mt-[88px]"
                            >
                                <div className="mb-7">
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-1.5 tabular-nums text-[var(--text-3)]">
                                        Cohort {edition}
                                    </p>
                                    <div className="flex items-baseline gap-5 mb-4">
                                        <h2 className="text-[clamp(2.8rem,6vw,5.5rem)] font-black tracking-[-0.05em] leading-none text-[var(--text-1)]">
                                            {year}
                                        </h2>
                                        <span className="text-xs font-semibold text-[var(--text-4)] tracking-[0.06em] uppercase">
                                            {group.length} alumni
                                        </span>
                                    </div>
                                    <div className="h-px bg-[var(--border)]"/>
                                </div>

                                <div className="grid gap-x-5 gap-y-8" style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}>
                                    {group.map(member => {
                                        const initials = member.fullName.split(" ").map(n => n[0]).slice(0, 2).join("");
                                        return (
                                            <Link key={member.id} href={`/members/${member.slug}`} className="group block no-underline">
                                                <div
                                                    className="overflow-hidden group-hover:scale-[1.03] aspect-[3/4] rounded-md bg-[var(--surface-raised)] flex items-center justify-center relative shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                                    style={{transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease"}}
                                                >
                                                    {member.photoUrl ? (
                                                        <Image
                                                            src={member.photoUrl}
                                                            alt={member.fullName}
                                                            fill
                                                            sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 160px"
                                                            className="object-cover object-top group-hover:brightness-105"
                                                            style={{transition: "filter 0.22s ease"}}
                                                        />
                                                    ) : (
                                                        <span className="text-[1.6rem] font-extrabold tracking-[-0.03em] text-[var(--text-3)]">
                                                            {initials}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2.5 text-center">
                                                    <p className="text-xs font-semibold text-[var(--text-1)] leading-[1.35] tracking-[-0.01em]">{member.fullName}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
