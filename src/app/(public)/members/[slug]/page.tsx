import {notFound} from "next/navigation";
import Image from "next/image";
import {PhotoZoom} from "@/components/ui/PhotoZoom";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {formatDate, formatFullDate, getMandateColor, STATUS_LABELS} from "@/lib/utils";
import {MemberStatus} from "@/generated/prisma/enums";
import {BadgeIcon} from "@/components/ui/BadgeIcon";

export const dynamic = "force-dynamic";

const EVENT_TYPE_COLORS: Record<string, string> = {
    ACTIVITIES: "#ec008c",
    CULTURAL: "#00aeef",
    PROJECTS: "#7ac143",
};

function eventDot(type: string) {
    return EVENT_TYPE_COLORS[type] ?? "#f47b20";
}

export default async function MemberProfilePage({
                                                    params,
                                                }: {
    params: Promise<{ slug: string }>;
}) {
    const {slug} = await params;

    const member = await prisma.member.findUnique({
        where: {slug},
        include: {
            statusHistory: {orderBy: {startedAt: "asc"}},
            mandateMemberships: {
                include: {mandate: true},
                orderBy: {mandate: {startsAt: "asc"}},
            },
            buddyLinksAsNewbie: {
                include: {buddy: {select: {id: true, slug: true, fullName: true, photoUrl: true}}},
            },
            buddyLinksAsBuddy: {
                include: {newbie: {select: {id: true, slug: true, fullName: true, photoUrl: true}}},
            },
            tributesReceived: {
                include: {author: {select: {id: true, slug: true, fullName: true, photoUrl: true}}},
                orderBy: {createdAt: "desc"},
            },
            memberBadges: {
                include: {badge: true},
                orderBy: {awardedAt: "desc"},
            },
            eventParticipations: {
                include: {event: true},
                orderBy: {event: {startsAt: "desc"}},
            },
        },
    });

    if (!member) notFound();

    const currentStatus =
        member.statusHistory.find((s) => !s.endedAt)?.status ?? ("NEWBIE" as MemberStatus);

    const latestMandate = member.mandateMemberships[member.mandateMemberships.length - 1]?.mandate ?? null;
    const accentColor = latestMandate ? getMandateColor(latestMandate.colorIndex, latestMandate.customColor) : "#0ea5e9";

    const nameParts = member.fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const restName = nameParts.slice(1).join(" ");

    const joinYear = new Date(member.joinedAt).getFullYear();
    const years = member.mandateMemberships.map(m => m.mandate.academicYear);
    const yearSpan = years.length > 0
        ? years.length === 1 ? years[0] : `${years[0]} — ${years[years.length - 1]}`
        : String(joinYear);

    const hasConnections =
        member.buddyLinksAsNewbie.length > 0 || member.buddyLinksAsBuddy.length > 0;

    return (
        <>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="bg-[var(--bg)] border-b border-[var(--border)] relative overflow-hidden">
                <div className="mx-auto px-5 md:px-10" style={{maxWidth: 1160}}>

                    <div className="pt-6">
                        <Link href="/members"
                              className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[var(--text-4)] no-underline">
                            ← Members
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 sm:items-end pt-8 sm:pt-10">

                        {/* Portrait */}
                        <div
                            className="shrink-0 w-[120px] h-[154px] sm:w-[200px] sm:h-[256px] rounded-t-lg overflow-hidden bg-[var(--surface-raised)] self-start sm:self-end">
                            {member.photoUrl ? (
                                <PhotoZoom
                                    src={member.photoUrl}
                                    alt={member.fullName}
                                    width={200}
                                    height={256}
                                    className="object-cover object-top w-full h-full"
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-[3rem] sm:text-[5rem] font-black tracking-[-0.04em]"
                                    style={{color: accentColor}}
                                >
                                    {firstName.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Identity */}
                        <div className="flex-1 pb-6 sm:pb-10 min-w-0">
                            <p
                                className="text-[11px] font-bold tracking-[0.18em] uppercase mb-5"
                                style={{color: accentColor}}
                            >
                                {yearSpan}
                            </p>

                            <h1 className="text-[clamp(3.2rem,6vw,6rem)] font-black tracking-[-0.045em] leading-[0.9] text-[var(--text-1)] mb-7">
                                {firstName}
                                {restName && <> {restName}</>}
                            </h1>

                            <div className="flex items-center gap-[14px] flex-wrap">
                <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.06em] uppercase"
                    style={{color: accentColor}}
                >
                  <span
                      className="size-1.5 rounded-full"
                      style={{background: accentColor, boxShadow: `0 0 6px ${accentColor}`}}
                  />
                    {STATUS_LABELS[currentStatus]}
                </span>
                                <span className="text-[var(--border-strong)] text-sm">·</span>
                                <span className="text-xs text-[var(--text-3)] tracking-[0.03em]">
                  Joined {joinYear}
                </span>
                                {member.linkedinUrl && (
                                    <>
                                        <span className="text-[var(--border-strong)] text-sm">·</span>
                                        <a
                                            href={member.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold no-underline tracking-[0.04em]"
                                            style={{color: accentColor}}
                                        >
                                            LinkedIn ↗
                                        </a>
                                    </>
                                )}
                            </div>

                            {member.bio && (
                                <p className="text-[15px] text-[var(--text-3)] leading-[1.65] max-w-[560px] mt-5">
                                    {member.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="mx-auto px-5 md:px-10 pb-20" style={{maxWidth: 1160}}>

                {/* Favourite memory */}
                {member.favouriteMemory && (
                    <div className="pt-12 pb-10 border-b border-[var(--border)]">
                        <p className="text-[clamp(1.05rem,1.8vw,1.35rem)] italic text-[var(--text-2)] leading-[1.65] max-w-[740px]">
              <span
                  aria-hidden
                  className="not-italic mr-1.5 align-[-.55em] leading-none"
                  style={{fontSize: "3rem", fontFamily: "Georgia, serif", color: accentColor}}
              >
                &ldquo;
              </span>
                            {member.favouriteMemory}
                        </p>
                    </div>
                )}

                {/* ── Three-col info strip ─────────────────────────────── */}
                <div
                    className="flex flex-col md:grid border-b border-[var(--border)]"
                    style={{gridTemplateColumns: `1fr${hasConnections ? " 1fr 1fr" : " 1fr"}`}}
                >
                    {/* Journey */}
                    {member.statusHistory.length > 0 && (
                        <div className="py-7 md:py-9 md:pr-10 border-b md:border-b-0 md:border-r border-[var(--border)]">
                            <MetaLabel>Journey</MetaLabel>
                            <div className="flex flex-col gap-[14px] mt-[18px]">
                                {member.statusHistory.map((sh) => {
                                    const active = !sh.endedAt;
                                    return (
                                        <div key={sh.id} className="flex gap-3 items-baseline">
                                            <div
                                                className="size-[5px] rounded-full shrink-0 mt-1"
                                                style={{
                                                    background: active ? accentColor : "var(--border-strong)",
                                                    boxShadow: active ? `0 0 5px ${accentColor}` : "none",
                                                }}
                                            />
                                            <div>
                                                <p className="text-[13px] font-semibold text-[var(--text-1)] leading-[1.3]">
                                                    {STATUS_LABELS[sh.status]}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-4)] mt-px">
                                                    {formatDate(sh.startedAt)}
                                                    {sh.endedAt ? ` – ${formatDate(sh.endedAt)}` : " – present"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Mandates */}
                    {member.mandateMemberships.length > 0 && (
                        <div
                            className="py-7 md:py-9 md:px-10 border-b md:border-b-0"
                            style={{borderRight: hasConnections ? "1px solid var(--border)" : "none"}}
                        >
                            <MetaLabel>Mandates</MetaLabel>
                            <div className="flex flex-col gap-[14px] mt-[18px]">
                                {member.mandateMemberships.map(({id, mandate, roleTitle, department}) => {
                                    const mc = getMandateColor(mandate.colorIndex, mandate.customColor);
                                    return (
                                        <Link key={id} href={`/mandates/${mandate.id}`}
                                              className="flex gap-3 items-start no-underline">
                                            <div className="size-[5px] rounded-full shrink-0 mt-[5px]"
                                                 style={{background: mc}}/>
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-[13px] font-semibold text-[var(--text-1)]">
                                                        {mandate.academicYear}
                                                    </p>
                                                    {roleTitle && (
                                                        <p className="text-[11px] text-[var(--text-4)]">{roleTitle}</p>
                                                    )}
                                                </div>
                                                {department && (
                                                    <p className="text-[11px] text-[var(--text-4)] mt-px">{department}</p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Buddy Network */}
                    {hasConnections && (
                        <div className="py-7 md:py-9 md:pl-10">
                            <MetaLabel>Network</MetaLabel>
                            <div className="flex flex-col gap-4 mt-[18px]">
                                {member.buddyLinksAsNewbie.map(({buddy}) => (
                                    <div key={buddy.id}>
                                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-4)] mb-[5px]">
                                            ← Buddies
                                        </p>
                                        <AvatarLink person={buddy}/>
                                    </div>
                                ))}
                                {member.buddyLinksAsBuddy.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[var(--text-4)] mb-[5px]">
                                            Buddies →
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            {member.buddyLinksAsBuddy.map(({newbie}) => (
                                                <AvatarLink key={newbie.id} person={newbie} small/>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Events ───────────────────────────────────────────── */}
                {member.eventParticipations.length > 0 && (
                    <div className="pt-10">
                        <div className="flex items-baseline justify-between mb-5">
                            <MetaLabel>Events</MetaLabel>
                            <span className="text-xs text-[var(--text-4)] tabular-nums">
                {member.eventParticipations.length}
              </span>
                        </div>

                        <div>
                            {member.eventParticipations.map(({event, role}, i) => {
                                const dot = eventDot(event.eventType);
                                const isLast = i === member.eventParticipations.length - 1;
                                return (
                                    <div
                                        key={event.id}
                                        className="grid items-center gap-3 py-[10px] [grid-template-columns:1fr_auto] sm:[grid-template-columns:28px_1fr_auto_auto]"
                                        style={{borderBottom: isLast ? "none" : "1px solid var(--border)"}}
                                    >
                                        <span className="hidden sm:inline text-[11px] text-[var(--text-4)] tabular-nums font-medium">
                                            {String(i + 1).padStart(2, "0")}
                                        </span>
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="size-1.5 rounded-full shrink-0" style={{background: dot}}/>
                                            <p className="text-sm font-semibold text-[var(--text-1)] truncate">
                                                {event.title}
                                            </p>
                                        </div>
                                        <span className="hidden sm:inline text-[11px] text-[var(--text-4)] capitalize whitespace-nowrap">
                                            {role.toLowerCase()}
                                        </span>
                                        <span className="text-[11px] text-[var(--text-4)] whitespace-nowrap tabular-nums">
                                            {formatDate(event.startsAt)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Tributes ─────────────────────────────────────────── */}
                {member.tributesReceived.length > 0 && (
                    <div className="mt-14 pt-10 border-t border-[var(--border)]">
                        <div className="mb-8"><MetaLabel>Tributes</MetaLabel></div>
                        <div className="flex flex-col gap-9">
                            {member.tributesReceived.map((tribute) => (
                                <div
                                    key={tribute.id}
                                    className="grid gap-5 items-start"
                                    style={{gridTemplateColumns: "36px 1fr"}}
                                >
                                    <Link href={`/members/${tribute.author.slug}`} className="no-underline">
                                        <div
                                            className="size-9 rounded-full overflow-hidden bg-[var(--surface-raised)] flex items-center justify-center text-xs font-bold text-[var(--text-3)]">
                                            {tribute.author.photoUrl ? (
                                                <Image
                                                    src={tribute.author.photoUrl}
                                                    alt={tribute.author.fullName}
                                                    width={36}
                                                    height={36}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                tribute.author.fullName.charAt(0)
                                            )}
                                        </div>
                                    </Link>

                                    <div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <Link href={`/members/${tribute.author.slug}`}
                                                  className="text-[13px] font-semibold text-[var(--text-1)] no-underline">
                                                {tribute.author.fullName}
                                            </Link>
                                            <span className="text-[11px] text-[var(--text-4)]">
                        {formatDate(tribute.createdAt)}
                      </span>
                                        </div>
                                        <p className="text-[15px] text-[var(--text-2)] leading-[1.65]">
                                            {tribute.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Badges ───────────────────────────────────────────── */}
                {member.memberBadges.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-[var(--border)]">
                        <div className="mb-4"><MetaLabel>Badges</MetaLabel></div>
                        <div className="flex flex-wrap gap-1.5">
                            {member.memberBadges.map(({id, badge, awardedAt}) => (
                                <div
                                    key={id}
                                    title={`${badge.description ?? ""} — awarded ${formatFullDate(awardedAt)}`}
                                    className="inline-flex items-center gap-[5px] px-[10px] py-1 rounded-[20px] bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold text-[var(--text-2)]"
                                >
                                    <BadgeIcon name={badge.icon} style={{flexShrink: 0}}/>
                                    {badge.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function MetaLabel({children}: { children: React.ReactNode }) {
    return (
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)]">
            {children}
        </p>
    );
}

function AvatarLink({
                        person,
                        small = false,
                    }: {
    person: { slug: string; fullName: string; photoUrl: string | null };
    small?: boolean;
}) {
    const size = small ? 24 : 30;
    return (
        <Link href={`/members/${person.slug}`} className="inline-flex items-center gap-2 no-underline">
            <div
                className="rounded-full overflow-hidden bg-[var(--surface-raised)] shrink-0 flex items-center justify-center text-[9px] font-bold text-[var(--text-3)]"
                style={{width: size, height: size}}
            >
                {person.photoUrl ? (
                    <Image
                        src={person.photoUrl}
                        alt={person.fullName}
                        width={size}
                        height={size}
                        className="object-cover w-full h-full"
                    />
                ) : (
                    person.fullName.charAt(0)
                )}
            </div>
            <span className="font-medium text-[var(--text-1)]" style={{fontSize: small ? 12 : 13}}>
        {person.fullName}
      </span>
        </Link>
    );
}
