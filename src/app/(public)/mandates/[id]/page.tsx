export const dynamic = "force-dynamic";

import {notFound} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {formatDate, formatFullDate, getMandateColor, statusAtDate, deptRoleOrder, isRoleSortedDept, isNamedSection, deptSectionOrder, STATUS_LABELS, STATUS_COLORS} from "@/lib/utils";

const MILESTONE_COLORS: Record<string, string> = {
    FOUNDING: "#7ac143",
    AWARD: "#facc15",
    ANNIVERSARY: "#f43f5e",
    PARTNERSHIP: "#a855f7",
    ACHIEVEMENT: "#10b981",
    ELECTION: "#ec008c",
    RECOGNITION: "#f97316",
    OTHER: "#f47b20",
};

function milestoneColor(type: string) {
    return MILESTONE_COLORS[type] ?? "#f47b20";
}

const EVENT_TYPE_LABELS: Record<string, string> = {
    ACTIVITIES: "Activities",
    CULTURAL: "Cultural",
    PROJECTS: "Projects",
};
const EVENT_TYPE_COLORS: Record<string, string> = {
    ACTIVITIES: "#ec008c",
    CULTURAL: "#00aeef",
    PROJECTS: "#7ac143",
};

function eventDot(type: string) {
    return EVENT_TYPE_COLORS[type] ?? "#f47b20";
}

function eventLabel(type: string) {
    return EVENT_TYPE_LABELS[type] ?? type;
}

export default async function MandatePage({
                                              params,
                                          }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [mandate, allMandates] = await Promise.all([
        prisma.mandate.findUnique({
            where: {id},
            include: {
                memberships: {
                    include: {member: {include: {statusHistory: true}}},
                    orderBy: [{sortOrder: "asc"}, {createdAt: "asc"}],
                },
                milestones: {orderBy: {happenedAt: "asc"}},
                events: {
                    orderBy: {startsAt: "asc"},
                    include: {_count: {select: {participations: true}}},
                },
            },
        }),
        prisma.mandate.findMany({
            orderBy: {startsAt: "asc"},
            select: {id: true, academicYear: true, startsAt: true},
        }),
    ]);

    if (!mandate) notFound();

    const color = getMandateColor(mandate.colorIndex, mandate.customColor);

    // Expand each membership into one slot per dept/role pair so members with
    // multiple roles appear once per department
    type Slot = { key: string; member: (typeof mandate.memberships)[0]["member"]; roleTitle: string };
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
                const dept = ms.departments[i]?.trim() || "";
                const role = ms.roleTitles[i] ?? "";
                if (dept && isNamedSection(dept)) {
                    if (!deptMap.has(dept)) deptMap.set(dept, []);
                    deptMap.get(dept)!.push({key: `${ms.id}_${i}`, member: ms.member, roleTitle: role});
                } else {
                    // Non-named dept collapses into General; show "Dept · Role" as the label
                    const displayRole = [dept, role].filter(Boolean).join(" · ");
                    if (!deptMap.has("General")) deptMap.set("General", []);
                    deptMap.get("General")!.push({key: `${ms.id}_${i}`, member: ms.member, roleTitle: displayRole});
                }
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

    const departments = [...deptMap.keys()].sort((a, b) => deptSectionOrder(a) - deptSectionOrder(b));

    const idx = allMandates.findIndex(m => m.id === id);
    const prev = idx > 0 ? allMandates[idx - 1] : null;
    const next = idx < allMandates.length - 1 ? allMandates[idx + 1] : null;

    const dateRange = [
        formatDate(mandate.startsAt),
        mandate.endsAt ? formatDate(mandate.endsAt) : "present",
    ].join(" – ");

    return (
        <>
            {/* ── Accent bar ─────────────────────────────────────────── */}
            <div style={{height: 3, background: color}}/>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="border-b border-[var(--border)]">
                <div className="mx-auto px-6 md:px-10" style={{maxWidth: 1160}}>

                    {/* Back + nav */}
                    <div className="flex items-center justify-between pt-5">
                        <Link
                            href="/mandates"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--text-4)] no-underline transition-opacity hover:opacity-60"
                        >
                            ← Mandates
                        </Link>
                        <div className="flex gap-5">
                            {prev && (
                                <Link href={`/mandates/${prev.id}`}
                                      className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-4)] no-underline transition-opacity hover:opacity-60">
                                    ← {prev.academicYear}
                                </Link>
                            )}
                            {next && (
                                <Link href={`/mandates/${next.id}`}
                                      className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-4)] no-underline transition-opacity hover:opacity-60">
                                    {next.academicYear} →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Main header content */}
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 md:items-end pt-7 pb-10">

                        {/* Text identity */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{color}}>
                                {dateRange}
                            </p>
                            <h1 className="text-[clamp(2.2rem,5vw,4.5rem)] font-black tracking-[-0.04em] leading-[0.95] text-[var(--text-1)] mb-5">
                                {mandate.name}
                            </h1>
                            <div className="flex gap-6 flex-wrap">
                                {[
                                    {n: mandate.memberships.length, label: "volunteers"},
                                    {n: mandate.events.length, label: "events"},
                                    {n: mandate.milestones.length, label: "milestones"},
                                ].filter(s => s.n > 0).map(({n, label}) => (
                                    <span key={label} className="text-[13px] text-[var(--text-3)]">
                    <strong className="text-[var(--text-1)] tabular-nums">{n}</strong>
                                        {" "}{label}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Team photo */}
                        {mandate.photoUrl && (
                            <div
                                className="shrink-0 w-full md:w-[260px] h-[180px] md:h-[164px] rounded-xl overflow-hidden">
                                <Image
                                    src={mandate.photoUrl}
                                    alt={`${mandate.name} team photo`}
                                    width={260}
                                    height={164}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div className="mx-auto px-6 md:px-10 pt-12 pb-20" style={{maxWidth: 1160}}>

                {/* Team */}
                {departments.length > 0 && (
                    <section className="mb-16">
                        <SectionLabel>Team</SectionLabel>

                        <div className="mt-8 flex flex-col gap-12">
                            {departments.map((dept) => {
                                const slots = deptMap.get(dept)!;
                                const showLabel = dept !== "General" || departments.length > 1;
                                const roleSorted = isRoleSortedDept(dept);

                                // Only General gets status sub-groups; all named sections render flat
                                const statusGroups = dept === "General" ? (() => {
                                    const groups = new Map<string, Slot[]>();
                                    for (const slot of slots) {
                                        const st = statusAtDate(slot.member.statusHistory, mandateAsOf);
                                        if (!groups.has(st)) groups.set(st, []);
                                        groups.get(st)!.push(slot);
                                    }
                                    return groups;
                                })() : null;

                                const renderGrid = (gridSlots: Slot[], showBadge: boolean) => (
                                    <div
                                        className="grid gap-x-4 gap-y-6"
                                        style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}
                                    >
                                        {gridSlots.map(({key, member, roleTitle}) => {
                                            const initials = member.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
                                            const st = statusAtDate(member.statusHistory, mandateAsOf);
                                            const {bg, text: tc} = STATUS_COLORS[st];
                                            return (
                                                <Link key={key} href={`/members/${member.slug}`} className="group block no-underline">
                                                    <div
                                                        className="overflow-hidden aspect-[3/4] rounded-md bg-[var(--surface-raised)] flex items-center justify-center relative shadow-[0_1px_3px_rgba(0,0,0,0.06)] group-hover:scale-[1.03]"
                                                        style={{transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1)"}}
                                                    >
                                                        {member.photoUrl ? (
                                                            <Image src={member.photoUrl} alt={member.fullName} fill sizes="(max-width: 640px) 45vw, 230px" className="object-cover object-top"/>
                                                        ) : (
                                                            <span className="text-[1.4rem] font-extrabold tracking-[-0.03em]" style={{color}}>{initials}</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-center">
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
                                    <div key={dept}>
                                        {showLabel && (
                                            <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-5" style={{color}}>{dept}</p>
                                        )}
                                        {statusGroups ? (
                                            <div className="flex flex-col gap-6">
                                                {(["SENIOR", "JUNIOR", "CANDIDATE_MEMBER", "NEWBIE", "ALUMNI"] as const)
                                                    .filter(s => statusGroups.has(s))
                                                    .map(status => (
                                                        <div key={status}>
                                                            <p className="text-[10px] font-medium text-[var(--text-4)] tracking-[0.1em] uppercase mb-3">{STATUS_LABELS[status]}</p>
                                                            {renderGrid(statusGroups.get(status)!, true)}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        ) : renderGrid(slots, true)}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Events */}
                {mandate.events.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-baseline justify-between mb-6">
                            <SectionLabel>Events</SectionLabel>
                            <span className="text-xs text-[var(--text-4)] tabular-nums">
                {mandate.events.length}
              </span>
                        </div>

                        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                            {mandate.events.map((event, i) => {
                                const dot = eventDot(event.eventType);
                                const isLast = i === mandate.events.length - 1;
                                return (
                                    <div
                                        key={event.id}
                                        className="grid items-center gap-3 md:gap-4 px-5 py-3"
                                        style={{
                                            gridTemplateColumns: "28px 1fr auto",
                                            borderBottom: isLast ? "none" : "1px solid var(--border)",
                                        }}
                                    >
                    <span className="text-[11px] text-[var(--text-4)] tabular-nums font-medium">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[13px] font-semibold text-[var(--text-1)] truncate">
                                                    {event.title}
                                                </p>
                                                <span
                                                    className="shrink-0 text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
                                                    style={{background: dot + "22", color: dot}}
                                                >
                          {eventLabel(event.eventType)}
                        </span>
                                            </div>
                                            {event.locationName && (
                                                <p className="text-[11px] text-[var(--text-4)] mt-px">{event.locationName}</p>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-[11px] text-[var(--text-4)] tabular-nums whitespace-nowrap">
                                                {formatDate(event.startsAt)}
                                            </p>
                                            {event._count.participations > 0 && (
                                                <p className="text-[10px] text-[var(--text-4)] mt-px">
                                                    {event._count.participations} vol.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Milestones */}
                {mandate.milestones.length > 0 && (
                    <section>
                        <div className="flex items-baseline justify-between mb-6">
                            <SectionLabel>Milestones</SectionLabel>
                            <span className="text-xs text-[var(--text-4)] tabular-nums">
                {mandate.milestones.length}
              </span>
                        </div>

                        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden">
                            {mandate.milestones.map((ms, i) => {
                                const mc = milestoneColor(ms.type);
                                const isLast = i === mandate.milestones.length - 1;
                                return (
                                    <div
                                        key={ms.id}
                                        className="grid items-start gap-3 md:gap-4 px-5 py-3"
                                        style={{
                                            gridTemplateColumns: "28px 1fr auto",
                                            borderBottom: isLast ? "none" : "1px solid var(--border)",
                                        }}
                                    >
                    <span className="text-[11px] text-[var(--text-4)] tabular-nums font-medium pt-[2px]">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[13px] font-semibold text-[var(--text-1)]">{ms.title}</p>
                                                <span
                                                    className="shrink-0 text-[9px] font-bold tracking-[0.1em] uppercase px-2 py-0.5 rounded-full"
                                                    style={{background: mc + "22", color: mc}}
                                                >
                          {ms.type.replace(/_/g, " ")}
                        </span>
                                            </div>
                                            {ms.description && (
                                                <p className="text-[12px] text-[var(--text-3)] leading-[1.5] mt-0.5">
                                                    {ms.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right shrink-0">
                                            <p className="text-[11px] text-[var(--text-4)] tabular-nums whitespace-nowrap">
                                                {formatFullDate(ms.happenedAt)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

function SectionLabel({children}: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)]">
            {children}
        </p>
    );
}
