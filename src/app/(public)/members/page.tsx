export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {getMandateColor} from "@/lib/utils";
import {MemberStatus} from "@/generated/prisma/enums";
import {YearbookIndex} from "@/components/public/YearbookIndex";
import {sectionId} from "@/lib/yearbook";

export default async function MembersPage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        include: {
            memberships: {
                include: {member: {include: {statusHistory: true}}},
                orderBy: {roleTitle: "asc"},
            },
        },
    });

    const uniqueMembers = new Set(
        mandates.flatMap(m => m.memberships.map(ms => ms.memberId)),
    ).size;

    const indexEntries = mandates.map((m, idx) => ({
        year: m.academicYear,
        color: getMandateColor(m.colorIndex, m.customColor),
        edition: String(mandates.length - idx).padStart(2, "0"),
    }));

    return (
        <div className="mx-auto px-10 pt-[52px] pb-[100px]" style={{maxWidth: 1280}}>

            {/* ── Two-column layout: index + chapters ───────────────── */}
            <div className="flex items-start gap-14">

                <YearbookIndex entries={indexEntries}/>

                <div className="flex-1 min-w-0 flex flex-col gap-[88px]">
                    {mandates.map((mandate, idx) => {
                        const color = getMandateColor(mandate.colorIndex, mandate.customColor);
                        const edition = String(mandates.length - idx).padStart(2, "0");

                        return (
                            <section
                                key={mandate.id}
                                id={sectionId(mandate.academicYear)}
                                className="scroll-mt-[88px]"
                            >
                                {/* Chapter header */}
                                <div className="mb-7">
                                    <p
                                        className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-1.5 tabular-nums"
                                        style={{color}}
                                    >
                                        Cohort {edition}
                                    </p>

                                    <div className="flex items-baseline gap-5 mb-4">
                                        <h2
                                            className="text-[clamp(2.8rem,6vw,5.5rem)] font-black tracking-[-0.05em] leading-none"
                                            style={{color}}
                                        >
                                            {mandate.academicYear}
                                        </h2>
                                        <span
                                            className="text-xs font-semibold text-[var(--text-4)] tracking-[0.06em] uppercase">
                      {mandate.memberships.length} volunteer{mandate.memberships.length !== 1 ? "s" : ""}
                    </span>
                                    </div>

                                    <div
                                        className="h-px opacity-50"
                                        style={{background: `linear-gradient(to right, ${color} 0%, ${color}00 100%)`}}
                                    />
                                </div>

                                {/* Portrait grid */}
                                <div
                                    className="grid gap-x-5 gap-y-8"
                                    style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}
                                >
                                    {mandate.memberships.map(({member, roleTitle}) => {
                                        const status = member.statusHistory.find(s => !s.endedAt)?.status ?? ("NEWBIE" as MemberStatus);
                                        const initials = member.fullName.split(" ").map(n => n[0]).slice(0, 2).join("");

                                        return (
                                            <Link
                                                key={member.id}
                                                href={`/members/${member.slug}`}
                                                className="group block no-underline"
                                            >
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
                                                        <span
                                                            className="text-[1.6rem] font-extrabold tracking-[-0.03em]"
                                                            style={{color}}
                                                        >
                              {initials}
                            </span>
                                                    )}
                                                </div>

                                                <div className="mt-2.5 text-center">
                                                    <p className="text-xs font-semibold text-[var(--text-1)] leading-[1.35] tracking-[-0.01em]">
                                                        {member.fullName}
                                                    </p>
                                                    <p className="text-[10px] font-medium text-[var(--text-4)] mt-[3px] tracking-[0.04em]">
                                                        {roleTitle}
                                                    </p>
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

            {/* ── Empty state ───────────────────────────────────────── */}
            {mandates.length === 0 && (
                <div className="py-24 text-center">
                    <p className="text-[13px] text-[var(--text-4)] tracking-[0.1em] uppercase">
                        No members yet
                    </p>
                </div>
            )}
        </div>
    );
}
