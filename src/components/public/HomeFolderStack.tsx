import Link from "next/link";
import Image from "next/image";
import {formatMembershipRoles, getMandateColor} from "@/lib/utils";
import {Reveal} from "@/components/ui/Reveal";

const TAB_H = 42;
const TAB_W = 158;
const TAB_STEP = 44;
const INITIAL_OFFSET = 20;
const CLOSED_H = 28;
const TAB_OVERLAP = 8;

const CLIP = "path('M 0 42 L 10 7 Q 12 0 19 0 L 139 0 Q 146 0 148 7 L 158 42 Z')";

const NAV_FOLDERS = [
    {href: "/members", label: "Members", color: "#ec008c"},
    {href: "/mandates", label: "Mandates", color: "#00aeef"},
    {href: "/network", label: "Network", color: "#7ac143"},
] as const;

type MemberPreview = {
    id: string; slug: string; fullName: string; photoUrl: string | null;
};

type MandateSummary = {
    id: string;
    name: string;
    academicYear: string;
    colorIndex: number;
    customColor?: string | null;
    memberships: Array<{ departments: string[]; roleTitles: string[]; member: MemberPreview }>;
};

export function HomeFolderStack({
                                    memberCount,
                                    mandateCount,
                                    sinceYear,
                                    latestMandate,
                                    pastMandates,
                                }: {
    memberCount: number;
    mandateCount: number;
    sinceYear: number | null;
    latestMandate: MandateSummary | null;
    pastMandates: Array<{
        id: string;
        academicYear: string;
        colorIndex: number;
        customColor?: string | null;
        memberships: { length: number }
    }>;
}) {
    const latestColor = latestMandate ? getMandateColor(latestMandate.colorIndex, latestMandate.customColor) : "var(--accent)";

    return (
        <div>

            {/* ── Closed nav folders ──────────────────────── */}
            {NAV_FOLDERS.map(({href, label, color}, i) => {
                const prevColor = i > 0 ? NAV_FOLDERS[i - 1].color : null;
                const folderDelay = 280 + i * 90;

                return (
                    <Reveal
                        key={href}
                        delay={folderDelay}
                        className="relative"
                        style={{marginTop: i === 0 ? 0 : -TAB_OVERLAP, zIndex: i + 1}}
                    >
                        <Link href={href} className="group block relative no-underline">

                            {/* Static prevColor fills */}
                            {prevColor && (
                                <>
                                    <div className="absolute inset-x-0 top-0 h-[42px]" style={{background: prevColor}}/>
                                    <div className="absolute left-0 top-[42px] size-3" style={{background: prevColor}}/>
                                    <div className="absolute right-0 top-[42px] size-3"
                                         style={{background: prevColor}}/>
                                </>
                            )}

                            {/* Folder unit — tab + body translate together on hover */}
                            <div
                                className="group-hover:-translate-y-1.5 relative pt-[42px]"
                                style={{transition: "transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)"}}
                            >
                                {/* Trapezoid tab */}
                                <div
                                    className="absolute top-0 flex items-center justify-center w-[158px] h-[42px]"
                                    style={{left: i * TAB_STEP + INITIAL_OFFSET, background: color, clipPath: CLIP}}
                                >
                  <span className="text-white font-semibold uppercase text-[11px] tracking-[0.14em]">
                    {label}
                  </span>
                                </div>

                                {/* Closed body strip */}
                                <div className="h-[28px] rounded-t-xl -mt-px" style={{background: color}}/>
                            </div>
                        </Link>
                    </Reveal>
                );
            })}

            {/* ── Welcome folder (always open) ────────────── */}
            {(() => {
                const i = NAV_FOLDERS.length;
                const prevColor = NAV_FOLDERS[NAV_FOLDERS.length - 1].color;

                return (
                    <Reveal
                        delay={550}
                        className="relative pt-[42px]"
                        style={{marginTop: -TAB_OVERLAP, zIndex: i + 1}}
                    >
                        {/* prevColor fills */}
                        <div className="absolute inset-x-0 top-0 h-[42px]" style={{background: prevColor}}/>
                        <div className="absolute left-0 top-[42px] size-3" style={{background: prevColor}}/>
                        <div className="absolute right-0 top-[42px] size-3" style={{background: prevColor}}/>

                        {/* Welcome tab */}
                        <div
                            className="absolute top-0 flex items-center justify-center w-[158px] h-[42px] bg-[var(--bg)]"
                            style={{left: i * TAB_STEP + INITIAL_OFFSET, clipPath: CLIP}}
                        >
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-3)]">
                Welcome
              </span>
                        </div>

                        {/* Welcome body */}
                        <div className="relative z-[1] -mt-px bg-[var(--bg)] rounded-xl">
                            <Reveal delay={700} y={0} className="mx-auto px-10 py-20" style={{maxWidth: 1100}}>

                                {/* Latest mandate */}
                                {latestMandate && (
                                    <section className="border-b border-[var(--border)] pb-[52px] mb-11">

                                        <div className="mb-7">
                                            <p
                                                className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-1.5 tabular-nums"
                                                style={{color: latestColor}}
                                            >
                                                Current mandate
                                            </p>

                                            <div className="flex items-baseline gap-5 mb-4 flex-wrap">
                                                <h2
                                                    className="text-[clamp(2.8rem,6vw,5.5rem)] font-black tracking-[-0.05em] leading-none"
                                                    style={{color: latestColor}}
                                                >
                                                    {latestMandate.academicYear}
                                                </h2>
                                                <span
                                                    className="text-xs font-semibold text-[var(--text-4)] tracking-[0.06em] uppercase">
                          {latestMandate.memberships.length} volunteer{latestMandate.memberships.length !== 1 ? "s" : ""}
                        </span>
                                                <Link
                                                    href={`/mandates/${latestMandate.id}`}
                                                    className="text-[13px] font-semibold no-underline opacity-80 whitespace-nowrap ml-auto"
                                                    style={{color: latestColor}}
                                                >
                                                    View mandate →
                                                </Link>
                                            </div>

                                            <div
                                                className="h-px opacity-50"
                                                style={{background: `linear-gradient(to right, ${latestColor} 0%, ${latestColor}00 100%)`}}
                                            />
                                        </div>

                                        {/* Portrait grid */}
                                        <div
                                            className="grid gap-x-5 gap-y-8"
                                            style={{gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))"}}
                                        >
                                            {latestMandate.memberships.map(({member, departments, roleTitles}, cardIdx) => {
                                                const initials = member.fullName.split(" ").map(n => n[0]).slice(0, 2).join("");
                                                const cardDelay = cardIdx < 8 ? 820 + cardIdx * 70 : 1380;
                                                return (
                                                    <Reveal key={member.id} delay={cardDelay}>
                                                        <Link href={`/members/${member.slug}`}
                                                              className="group block no-underline">
                                                            <div
                                                                className="overflow-hidden group-hover:scale-[1.03] aspect-[3/4] rounded-md bg-[var(--surface-raised)] flex items-center justify-center relative shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                                                                style={{transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease"}}
                                                            >
                                                                {member.photoUrl ? (
                                                                    <Image
                                                                        src={member.photoUrl}
                                                                        alt={member.fullName}
                                                                        fill
                                                                        sizes="(max-width: 640px) 45vw, 230px"
                                                                        className="object-cover object-top group-hover:brightness-105"
                                                                        style={{transition: "filter 0.22s ease"}}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="text-[1.6rem] font-extrabold tracking-[-0.03em]"
                                                                        style={{color: latestColor}}
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
                                                                    {formatMembershipRoles(departments, roleTitles)}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    </Reveal>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Archive ledger */}
                                {pastMandates.length > 0 && (
                                    <section>
                                        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[var(--text-4)] mb-5">
                                            Archive
                                        </p>
                                        <div>
                                            {pastMandates.map((m, idx) => {
                                                const color = getMandateColor(m.colorIndex, m.customColor);
                                                const edition = String(mandateCount - 1 - idx).padStart(2, "0");
                                                return (
                                                    <Link
                                                        key={m.id}
                                                        href={`/mandates/${m.id}`}
                                                        className="group/row flex items-center gap-5 py-[13px] border-b border-[var(--border)] no-underline"
                                                    >
                            <span
                                className="text-[10px] font-bold tracking-[0.12em] opacity-50 min-w-6 tabular-nums"
                                style={{color}}
                            >
                              {edition}
                            </span>
                                                        <span
                                                            className="group-hover/row:text-[var(--accent)] text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-1)] flex-1 transition-colors duration-150 tabular-nums">
                              {m.academicYear}
                            </span>
                                                        <span className="text-xs text-[var(--text-4)] tabular-nums">
                              {m.memberships.length} volunteer{m.memberships.length !== 1 ? "s" : ""}
                            </span>
                                                        <span
                                                            className="group-hover/row:opacity-100 text-[13px] text-[var(--text-3)] opacity-0 transition-opacity duration-150">
                              →
                            </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                {/* Empty state */}
                                {!latestMandate && pastMandates.length === 0 && (
                                    <p className="text-[13px] text-[var(--text-4)] tracking-[0.1em] uppercase text-center py-12">
                                        No records yet
                                    </p>
                                )}

                            </Reveal>
                        </div>
                    </Reveal>
                );
            })()}

        </div>
    );
}
