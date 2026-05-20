export const dynamic = "force-dynamic";

import {notFound} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {formatDate, formatFullDate, getMandateColor} from "@/lib/utils";

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

    // Group members by department; null/empty → labelled "General"
    const deptMap = new Map<string, typeof mandate.memberships>();
    for (const ms of mandate.memberships) {
        const key = ms.department?.trim() || "General";
        if (!deptMap.has(key)) deptMap.set(key, []);
        deptMap.get(key)!.push(ms);
    }
    // Sort: Board first, named departments alphabetically, "General" last
    const departments = [...deptMap.keys()].sort((a, b) => {
        if (a === "Board") return -1;
        if (b === "Board") return 1;
        if (a === "General") return 1;
        if (b === "General") return -1;
        return a.localeCompare(b);
    });

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
            <div className="relative overflow-hidden border-b border-[var(--border)]">

                {/* Ghost year */}
                <div
                    aria-hidden
                    className="absolute pointer-events-none select-none whitespace-nowrap"
                    style={{
                        right: -20, top: "50%", transform: "translateY(-50%)",
                        fontSize: "clamp(7rem,18vw,16rem)", fontWeight: 900,
                        letterSpacing: "-0.05em", lineHeight: 1,
                        color, opacity: 0.07,
                    }}
                >
                    {mandate.academicYear}
                </div>

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
                                const members = deptMap.get(dept)!;
                                const showLabel = dept !== "General" || departments.length > 1;
                                return (
                                    <div key={dept}>
                                        {showLabel && (
                                            <p className="text-[10px] font-bold tracking-[0.14em] uppercase mb-5"
                                               style={{color}}>
                                                {dept}
                                            </p>
                                        )}

                                        <div
                                            className="grid gap-x-4 gap-y-6"
                                            style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}
                                        >
                                            {members.map(({member, roleTitle}) => {
                                                const initials = member.fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("");
                                                return (
                                                    <Link
                                                        key={member.id}
                                                        href={`/members/${member.slug}`}
                                                        className="group block no-underline"
                                                    >
                                                        <div
                                                            className="overflow-hidden aspect-[3/4] rounded-md bg-[var(--surface-raised)] flex items-center justify-center relative shadow-[0_1px_3px_rgba(0,0,0,0.06)] group-hover:scale-[1.03]"
                                                            style={{transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1)"}}
                                                        >
                                                            {member.photoUrl ? (
                                                                <Image
                                                                    src={member.photoUrl}
                                                                    alt={member.fullName}
                                                                    fill
                                                                    sizes="(max-width: 640px) 30vw, (max-width: 1024px) 18vw, 140px"
                                                                    className="object-cover object-top"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-[1.4rem] font-extrabold tracking-[-0.03em]"
                                                                    style={{color}}
                                                                >
                                  {initials}
                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 text-center">
                                                            <p className="text-xs font-semibold text-[var(--text-1)] leading-[1.35] tracking-[-0.01em]">
                                                                {member.fullName}
                                                            </p>
                                                            {roleTitle && (
                                                                <p className="text-[10px] font-medium text-[var(--text-4)] mt-[3px] tracking-[0.04em]">
                                                                    {roleTitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
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
