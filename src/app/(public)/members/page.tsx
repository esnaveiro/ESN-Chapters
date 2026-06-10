export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {getMandateColor, latestStatus, statusAtDate, deptRoleOrder, isRoleSortedDept, STATUS_LABELS, STATUS_COLORS} from "@/lib/utils";
import {YearbookIndex} from "@/components/public/YearbookIndex";
import {sectionId} from "@/lib/yearbook";

export default async function MembersPage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        include: {
            memberships: {
                include: {member: {include: {statusHistory: true}}},
                orderBy: [{sortOrder: "asc"}, {createdAt: "asc"}],
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
        <div className="mx-auto px-5 md:px-10 pt-8 md:pt-[52px] pb-[100px]" style={{maxWidth: 1280}}>

            {/* ── Two-column layout: index + chapters ───────────────── */}
            <div className="flex gap-14">

                <div className="hidden md:block">
                    <YearbookIndex entries={indexEntries}/>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-[88px]">
                    {mandates.map((mandate, idx) => {
                        const color = getMandateColor(mandate.colorIndex, mandate.customColor);
                        const edition = String(idx + 1).padStart(2, "0");

                        // Expand memberships into per dept/role slots
                        type Slot = {key: string; member: (typeof mandate.memberships)[0]["member"]; roleTitle: string};
                        const deptMap = new Map<string, Slot[]>();
                        for (const ms of mandate.memberships) {
                            // Skip unassigned alumni (General only) if they were already ALUMNI before this mandate.
                            // Members with an explicit role/department are always shown regardless of alumni status.
                            const alumniStart = ms.member.statusHistory.find(sh => sh.status === "ALUMNI")?.startedAt;
                            const hasRole = ms.departments.length > 0 && ms.departments.some(d => d.trim());
                            if (!hasRole && alumniStart && new Date(alumniStart) < mandate.startsAt) continue;

                            if (ms.departments.length === 0) {
                                if (!deptMap.has("General")) deptMap.set("General", []);
                                deptMap.get("General")!.push({key: ms.id, member: ms.member, roleTitle: ms.roleTitles.join(" · ")});
                            } else {
                                for (let i = 0; i < ms.departments.length; i++) {
                                    const dept = ms.departments[i]?.trim() || "General";
                                    if (!deptMap.has(dept)) deptMap.set(dept, []);
                                    deptMap.get(dept)!.push({key: `${ms.id}_${i}`, member: ms.member, roleTitle: ms.roleTitles[i] ?? ""});
                                }
                            }
                        }

                        const mandateAsOf = mandate.endsAt ?? new Date();
                        for (const [dept, slots] of deptMap) {
                            if (isRoleSortedDept(dept)) {
                                slots.sort((a, b) => {
                                    const ao = deptRoleOrder(dept, a.roleTitle);
                                    const bo = deptRoleOrder(dept, b.roleTitle);
                                    return ao !== bo ? ao - bo : a.member.fullName.localeCompare(b.member.fullName);
                                });
                            } else {
                                slots.sort((a, b) => a.member.fullName.localeCompare(b.member.fullName));
                            }
                        }
                        const departments = [...deptMap.keys()].sort((a, b) => {
                            if (a === "Board") return -1;
                            if (b === "Board") return 1;
                            if (a === "General") return 1;
                            if (b === "General") return -1;
                            return a.localeCompare(b);
                        });

                        const totalSlots = [...deptMap.values()].reduce((n, s) => n + s.length, 0);

                        const renderGrid = (gridSlots: Slot[], showBadge: boolean) => (
                            <div className="grid gap-x-5 gap-y-8" style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}>
                                {gridSlots.map(({key, member, roleTitle}) => {
                                    const initials = member.fullName.split(" ").map(n => n[0]).slice(0, 2).join("");
                                    const st = statusAtDate(member.statusHistory, mandateAsOf);
                                    const {bg, text: tc} = STATUS_COLORS[st];
                                    return (
                                        <Link key={key} href={`/members/${member.slug}`} className="group block no-underline">
                                            <div className="overflow-hidden group-hover:scale-[1.03] aspect-[3/4] rounded-md bg-[var(--surface-raised)] flex items-center justify-center relative shadow-[0_1px_3px_rgba(0,0,0,0.06)]" style={{transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease"}}>
                                                {member.photoUrl ? (
                                                    <Image src={member.photoUrl} alt={member.fullName} fill sizes="(max-width: 640px) 30vw, (max-width: 1024px) 20vw, 160px" className="object-cover object-top group-hover:brightness-105" style={{transition: "filter 0.22s ease"}}/>
                                                ) : (
                                                    <span className="text-[1.6rem] font-extrabold tracking-[-0.03em]" style={{color}}>{initials}</span>
                                                )}
                                            </div>
                                            <div className="mt-2.5 text-center">
                                                <p className="text-xs font-semibold text-[var(--text-1)] leading-[1.35] tracking-[-0.01em]">{member.fullName}</p>
                                                {roleTitle && <p className="text-[10px] font-medium text-[var(--text-4)] mt-[3px] tracking-[0.04em]">{roleTitle}</p>}
                                                {showBadge && <span className="inline-block mt-1.5 text-[9px] font-bold tracking-[0.07em] uppercase px-1.5 py-px rounded-full" style={{background: bg, color: tc}}>{STATUS_LABELS[st]}</span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        );

                        return (
                            <section
                                key={mandate.id}
                                id={sectionId(mandate.academicYear)}
                                className="scroll-mt-[88px]"
                            >
                                {/* Chapter header */}
                                <div className="mb-7">
                                    <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-1.5 tabular-nums" style={{color}}>
                                        Cohort {edition}
                                    </p>
                                    <div className="flex items-baseline gap-5 mb-4">
                                        <h2 className="text-[clamp(2.8rem,6vw,5.5rem)] font-black tracking-[-0.05em] leading-none" style={{color}}>
                                            {mandate.academicYear}
                                        </h2>
                                        <span className="text-xs font-semibold text-[var(--text-4)] tracking-[0.06em] uppercase">
                                            {mandate.memberships.length} volunteer{mandate.memberships.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="h-px opacity-50" style={{background: `linear-gradient(to right, ${color} 0%, ${color}00 100%)`}}/>
                                </div>

                                {/* Grouped portrait sections */}
                                {totalSlots > 0 && (
                                    <div className="flex flex-col gap-8">
                                        {departments.map(dept => {
                                            const slots = deptMap.get(dept)!;
                                            const showLabel = dept !== "General" || departments.length > 1;
                                            const roleSorted = isRoleSortedDept(dept);

                                            const statusGroups = roleSorted ? null : (() => {
                                                const groups = new Map<string, Slot[]>();
                                                for (const slot of slots) {
                                                    const st = statusAtDate(slot.member.statusHistory, mandateAsOf);
                                                    if (!groups.has(st)) groups.set(st, []);
                                                    groups.get(st)!.push(slot);
                                                }
                                                return groups;
                                            })();

                                            return (
                                                <div key={dept}>
                                                    {showLabel && (
                                                        <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-4 opacity-70" style={{color}}>{dept}</p>
                                                    )}
                                                    {roleSorted ? renderGrid(slots, true) : (
                                                        <div className="flex flex-col gap-6">
                                                            {(["SENIOR", "JUNIOR", "CANDIDATE_MEMBER", "NEWBIE", "ALUMNI"] as const)
                                                                .filter(s => statusGroups!.has(s))
                                                                .map(status => (
                                                                    <div key={status}>
                                                                        <p className="text-[10px] font-medium text-[var(--text-4)] tracking-[0.1em] uppercase mb-3">{STATUS_LABELS[status]}</p>
                                                                        {renderGrid(statusGroups!.get(status)!, true)}
                                                                    </div>
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
