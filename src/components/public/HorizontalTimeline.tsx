"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {getMandateColor} from "@/lib/utils";

const EVENT_TYPE_COLORS: Record<string, string> = {
    ACTIVITIES: "#ec008c",
    CULTURAL: "#00aeef",
    PROJECTS: "#7ac143",
};

const EVENT_TYPE_FALLBACK = "#f47b20";

const MILESTONE_TYPE_COLORS: Record<string, string> = {
    FOUNDING: "#7ac143",
    AWARD: "#facc15",
    ANNIVERSARY: "#f43f5e",
    PARTNERSHIP: "#a855f7",
    ACHIEVEMENT: "#10b981",
    ELECTION: "#ec008c",
    RECOGNITION: "#f97316",
    OTHER: "#f47b20",
};

function eventTypeColor(type: string) {
    return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_FALLBACK;
}

function milestoneTypeColor(type: string) {
    return MILESTONE_TYPE_COLORS[type] ?? EVENT_TYPE_FALLBACK;
}

/* ── Serialised types (Dates become strings via RSC boundary) ── */
export type SerMandateMember = { id: string; slug: string; fullName: string; photoUrl: string | null };
export type SerMandate = {
    id: string; name: string; academicYear: string; colorIndex: number; customColor?: string | null;
    startsAt: string; endsAt: string | null;
    _count: { memberships: number; events: number };
    members: SerMandateMember[];
};
export type SerMilestone = {
    id: string; title: string; description: string | null;
    happenedAt: string; type: string;
};
export type SerEvent = {
    id: string; title: string;
    startsAt: string; endsAt: string;
    locationName: string | null; scope: string; eventType: string;
    _count: { participations: number };
};

/* ── Layout constants ─────────────────────────────────────────── */
const NAV_H = 56;
const PX_PER_DAY = 5;
const TRACK_FRAC = 0.42;   // track rail at 42% of sticky height
const PAD_L = 220;    // left padding before first item
const PAD_R = 380;    // right padding after last item
const CURSOR_F = 0.24;   // cursor at 24% from left of viewport
const MS_DAY = 86_400_000;

function toX(date: Date, origin: Date) {
    return PAD_L + ((date.getTime() - origin.getTime()) / MS_DAY) * PX_PER_DAY;
}

const MINIMAP_W = 210;
const MINIMAP_H = 48;
const YEAR_HEADER_H = 34;

export function HorizontalTimeline({mandates, milestones, events}: {
    mandates: SerMandate[];
    milestones: SerMilestone[];
    events: SerEvent[];
}) {
    const outerRef = useRef<HTMLDivElement>(null);
    const [tx, setTx] = useState(0);
    const [vw, setVw] = useState(1280);
    const [vh, setVh] = useState(800);
    const [isMobile, setIsMobile] = useState(false);
    const dragRef = useRef<{ startX: number; startScroll: number } | null>(null);
    const scrubDragRef = useRef(false);
    const [activeMandateId, setActiveMandateId] = useState<string | null>(mandates[0]?.id ?? null);
    const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = useState<
        | { kind: "event"; data: SerEvent; color: string }
        | { kind: "milestone"; data: SerMilestone; color: string }
        | null
    >(null);

    /* ── Date bounds ────────────────────────────────────────────── */
    const origin = useMemo(() => {
        const ts = [
            ...mandates.map(m => +new Date(m.startsAt)),
            ...milestones.map(m => +new Date(m.happenedAt)),
            ...events.map(e => +new Date(e.startsAt)),
        ];
        return new Date(Math.min(...ts));
    }, [mandates, milestones, events]);

    const lastDate = useMemo(() => {
        const ts = [
            ...mandates.map(m => +(m.endsAt ? new Date(m.endsAt) : new Date(m.startsAt))),
            ...milestones.map(m => +new Date(m.happenedAt)),
            ...events.map(e => +new Date(e.endsAt || e.startsAt)),
        ];
        return new Date(Math.max(...ts));
    }, [mandates, milestones, events]);

    const totalWidth = useMemo(
        () => PAD_L + ((lastDate.getTime() - origin.getTime()) / MS_DAY) * PX_PER_DAY + PAD_R,
        [origin, lastDate],
    );

    /* ── Mandate date ranges (for active detection) ─────────────── */
    const mandateRanges = useMemo(() => mandates.map((m, i) => ({
        id: m.id,
        start: new Date(m.startsAt),
        end: m.endsAt
            ? new Date(m.endsAt)
            : i < mandates.length - 1
                ? new Date(mandates[i + 1].startsAt)
                : lastDate,
    })), [mandates, lastDate]);

    /* ── Viewport size ──────────────────────────────────────────── */
    useEffect(() => {
        const update = () => {
            setVw(window.innerWidth);
            setVh(window.innerHeight);
            setIsMobile(window.innerWidth < 768);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    /* ── Scroll → translateX + active mandate ───────────────────── */
    const MOBILE_NAV_H = 56;
    const scrollHeight = Math.max(totalWidth - vw * (1 - CURSOR_F) + 100, 600);
    const maxTx = Math.max(0, totalWidth - vw * (1 - CURSOR_F));

    /* ── Scrubber ───────────────────────────────────────────────── */
    const scrubberH = 40;
    const scrubThumbW = 40;
    const scrubThumbX = maxTx > 0 ? (tx / maxTx) * ((vw - 24) - scrubThumbW) : 0;

    function moveScrubber(e: React.PointerEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const outer = outerRef.current;
        if (!outer) return;
        const outerTop = outer.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({top: outerTop + fraction * scrollHeight});
    }

    function handleScrubPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        scrubDragRef.current = true;
        moveScrubber(e);
    }

    function handleScrubPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!scrubDragRef.current) return;
        moveScrubber(e);
    }

    function handleScrubPointerUp() {
        scrubDragRef.current = false;
    }

    function handleDragStart(e: React.PointerEvent) {
        if (!isMobile) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const outerTop = outerRef.current
            ? outerRef.current.getBoundingClientRect().top + window.scrollY
            : 0;
        dragRef.current = {startX: e.clientX, startScroll: window.scrollY - outerTop};
    }

    function handleDragMove(e: React.PointerEvent) {
        if (!isMobile || !dragRef.current) return;
        const dx = dragRef.current.startX - e.clientX;
        const targetScroll = dragRef.current.startScroll + dx * (scrollHeight / maxTx);
        const outerTop = outerRef.current
            ? outerRef.current.getBoundingClientRect().top + window.scrollY
            : 0;
        window.scrollTo({top: outerTop + Math.max(0, Math.min(scrollHeight, targetScroll))});
    }

    function handleDragEnd() {
        dragRef.current = null;
    }

    const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const fraction = (e.clientX - rect.left) / rect.width;
        const targetTx = fraction * totalWidth;
        const progress = Math.min(1, Math.max(0, targetTx / maxTx));
        const outerTop = outerRef.current
            ? outerRef.current.getBoundingClientRect().top + window.scrollY
            : 0;
        window.scrollTo({top: outerTop + progress * scrollHeight, behavior: "smooth"});
    }, [totalWidth, maxTx, scrollHeight]);

    useEffect(() => {
        const handle = () => {
            const outer = outerRef.current;
            if (!outer) return;
            const scrolled = Math.max(0, -(outer.getBoundingClientRect().top - NAV_H));
            const progress = Math.min(1, scrolled / scrollHeight);
            const newTx = progress * maxTx;
            setTx(newTx);

            // date currently under cursor
            const cursorDate = new Date(
                origin.getTime() + ((newTx + vw * CURSOR_F - PAD_L) / PX_PER_DAY) * MS_DAY,
            );
            const hit = mandateRanges.find(
                r => cursorDate >= r.start && cursorDate <= r.end,
            );
            setActiveMandateId(hit?.id ?? null);
        };

        window.addEventListener("scroll", handle, {passive: true});
        handle();
        return () => window.removeEventListener("scroll", handle);
    }, [scrollHeight, maxTx, origin, mandateRanges]);

    /* ── Derived active info ────────────────────────────────────── */
    const activeMandateIdx = mandates.findIndex(m => m.id === activeMandateId);
    const activeMandate = mandates[activeMandateIdx] ?? null;
    const activeColor = activeMandate
        ? getMandateColor(activeMandate.colorIndex ?? activeMandateIdx, activeMandate.customColor)
        : getMandateColor(0);

    /* ── Year ticks ─────────────────────────────────────────────── */
    const years = useMemo(() => {
        const ys: Array<{ year: number; x: number }> = [];
        for (let y = origin.getFullYear(); y <= lastDate.getFullYear() + 1; y++) {
            ys.push({year: y, x: toX(new Date(y, 0, 1), origin)});
        }
        return ys;
    }, [origin, lastDate]);

    const stickyH = vh - NAV_H;
    const trackY = stickyH * TRACK_FRAC;

    /* ── Render ─────────────────────────────────────────────────── */
    if (!mandates.length) return null;

    return (
        <div
            ref={outerRef}
            style={{height: `${stickyH + scrollHeight}px`}}
        >
            {/* ── Sticky viewport ───────────────────────────────────── */}
            <div
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                style={{
                    position: "sticky",
                    top: NAV_H,
                    height: stickyH,
                    overflow: "hidden",
                    background: "var(--bg)",
                    touchAction: isMobile ? "none" : "auto",
                    cursor: isMobile ? "grab" : "default",
                }}
            >

                {/* ── Fixed year header ────────────────────────────────── */}
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: YEAR_HEADER_H,
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg)",
                    zIndex: 15,
                    overflow: "hidden",
                }}>
                    {years.map(({year, x}) => {
                        const screenX = x - tx;
                        if (screenX < -60 || screenX > vw + 60) return null;
                        return (
                            <div
                                key={year}
                                style={{
                                    position: "absolute",
                                    left: screenX,
                                    top: 0,
                                    height: "100%",
                                    transform: "translateX(-50%)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            >
                                <div style={{width: 1, height: 10, background: "var(--border-strong)", flexShrink: 0}}/>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "var(--text-3)",
                                    letterSpacing: "0.1em",
                                    whiteSpace: "nowrap",
                                }}>
                                    {year}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Scrolling track layer ────────────────────────────── */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: totalWidth,
                        transform: `translateX(${-tx}px)`,
                        willChange: "transform",
                    }}
                >
                    {/* Mandate era bands (full height, behind track) */}
                    {mandates.map((m, i) => {
                        const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                        const x1 = toX(new Date(m.startsAt), origin);
                        const x2 = toX(mandateRanges[i].end, origin);
                        const w = Math.max(x2 - x1, 4);
                        const isActive = m.id === activeMandateId;
                        const ICON_S = 24;   // icon diameter
                        const OVERLAP = 7;    // px each icon steps right
                        return (
                            <div
                                key={m.id}
                                style={{
                                    position: "absolute", left: x1, top: 0,
                                    width: w, height: trackY,
                                }}
                            >
                                {/* Tinted background */}
                                <div style={{
                                    position: "absolute", inset: 0,
                                    background: color,
                                    opacity: isActive ? 0.12 : 0.055,
                                    transition: "opacity 0.5s ease",
                                    pointerEvents: "none",
                                }}/>
                                {/* Member avatar stack — below year header */}
                                <div style={{
                                    position: "absolute", top: YEAR_HEADER_H + 8, left: 10,
                                    display: "flex",
                                    overflow: "visible",
                                }}>
                                    {m.members.map((mem, j) => {
                                        const isIconHovered = hoveredMemberId === mem.id;
                                        return (
                                            <Link
                                                key={mem.id}
                                                href={`/members/${mem.slug}`}
                                                style={{
                                                    position: "relative",
                                                    display: "block",
                                                    width: ICON_S, height: ICON_S,
                                                    flexShrink: 0,
                                                    marginLeft: j === 0 ? 0 : -(OVERLAP),
                                                    zIndex: isIconHovered ? 20 : 1,
                                                    cursor: "pointer",
                                                }}
                                                onMouseEnter={() => setHoveredMemberId(mem.id)}
                                                onMouseLeave={() => setHoveredMemberId(null)}
                                            >
                                                {/* Circle */}
                                                <div style={{
                                                    width: ICON_S, height: ICON_S, borderRadius: "50%",
                                                    border: `2px solid ${color}`,
                                                    background: color,
                                                    overflow: "hidden",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    boxShadow: isIconHovered
                                                        ? `0 2px 12px ${color}66, 0 0 0 2px ${color}`
                                                        : "0 0 0 1px rgba(255,255,255,0.6)",
                                                    transform: isIconHovered ? "scale(1.85)" : "scale(1)",
                                                    transformOrigin: "top center",
                                                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                                                }}>
                                                    {mem.photoUrl
                                                        ? <img src={mem.photoUrl} alt="" style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover"
                                                        }}/>
                                                        : <span style={{
                                                            fontSize: 7.5,
                                                            fontWeight: 800,
                                                            color: "white",
                                                            userSelect: "none",
                                                            letterSpacing: "-0.02em"
                                                        }}>
                                {initials(mem.fullName)}
                              </span>
                                                    }
                                                </div>
                                                {/* Name tooltip below scaled icon */}
                                                {isIconHovered && (
                                                    <div style={{
                                                        position: "absolute",
                                                        top: "100%",
                                                        left: "50%",
                                                        transform: "translateX(-50%)",
                                                        marginTop: ICON_S * 0.85,
                                                        whiteSpace: "nowrap",
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        letterSpacing: "0.04em",
                                                        color: "var(--text-1)",
                                                        background: "var(--bg)",
                                                        border: `1px solid ${color}44`,
                                                        padding: "2px 7px",
                                                        borderRadius: 4,
                                                        pointerEvents: "none",
                                                        zIndex: 30,
                                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                                    }}>
                                                        {mem.fullName}
                                                    </div>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Progress fill left of cursor */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: trackY,
                            width: tx + vw * CURSOR_F,
                            height: 2,
                            background: activeColor,
                            opacity: 0.55,
                            transition: "background 0.4s ease",
                            zIndex: 1,
                        }}
                    />

                    {/* Track rail */}
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: trackY,
                            width: "100%",
                            height: 2,
                            background: "var(--border)",
                        }}
                    />

                    {/* Year tick marks on rail (no labels — header handles those) */}
                    {years.map(({year, x}) => (
                        <div key={year} style={{
                            position: "absolute", left: x, top: trackY,
                        }}>
                            <div style={{
                                position: "absolute", top: 3,
                                left: "50%", transform: "translateX(-50%)",
                                width: 1, height: 8, background: "var(--border-strong)",
                            }}/>
                        </div>
                    ))}

                    {/* Mandate start markers */}
                    {mandates.map((m, i) => {
                        const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                        const x = toX(new Date(m.startsAt), origin);
                        const isActive = m.id === activeMandateId;
                        return (
                            <div key={m.id} style={{position: "absolute", left: x, top: trackY}}>
                                {/* Dot */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -7, left: -7,
                                        width: 14, height: 14,
                                        borderRadius: "50%",
                                        background: color,
                                        border: "3px solid var(--bg)",
                                        boxShadow: isActive ? `0 0 0 3px ${color}55` : "none",
                                        transition: "box-shadow 0.3s ease",
                                        zIndex: 3,
                                    }}
                                />
                                {/* Year pill above */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: 22,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: isActive ? color : "var(--surface-sunken)",
                                        color: isActive ? "white" : "var(--text-3)",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "3px 9px",
                                        borderRadius: 20,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        whiteSpace: "nowrap",
                                        transition: "background 0.3s ease, color 0.3s ease",
                                        userSelect: "none",
                                    }}
                                >
                                    {m.academicYear}
                                </div>
                            </div>
                        );
                    })}

                    {/* Milestone stems + cards (above track) */}
                    {milestones.map((ms, i) => {
                        const x = toX(new Date(ms.happenedAt), origin);
                        const STEMS = [20, 64];
                        const stemH = STEMS[i % STEMS.length];
                        const typeColor = milestoneTypeColor(ms.type);
                        const dateStr = new Date(ms.happenedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        });
                        const longDate = new Date(ms.happenedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                        });
                        const isMsHover = hoveredItem?.kind === "milestone" && hoveredItem.data.id === ms.id;
                        return (
                            <div
                                key={ms.id}
                                style={{
                                    position: "absolute", left: x, top: trackY, transform: "translateX(-50%)",
                                    zIndex: isMsHover ? 10 : 2,
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => setHoveredItem({kind: "milestone", data: ms, color: typeColor})}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {/* Hover info — below track */}
                                {isMsHover && (
                                    <div style={{
                                        position: "absolute",
                                        top: 24,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 200,
                                        textAlign: "center",
                                        zIndex: 15,
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}>
                                        {ms.description && (
                                            <p style={{
                                                fontSize: 13,
                                                color: "var(--text-2)",
                                                lineHeight: 1.55,
                                                marginBottom: 10
                                            }}>
                                                {ms.description}
                                            </p>
                                        )}
                                        <p style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: typeColor,
                                            letterSpacing: "0.04em"
                                        }}>
                                            {longDate}
                                        </p>
                                    </div>
                                )}
                                {/* Diamond */}
                                <div style={{
                                    position: "absolute",
                                    top: -8, left: -8,
                                    width: 16, height: 16,
                                    background: typeColor,
                                    border: "2px solid var(--bg)",
                                    transform: "rotate(45deg)",
                                    borderRadius: 3,
                                    zIndex: 3,
                                }}/>
                                {/* Stem going up */}
                                <div style={{
                                    position: "absolute",
                                    bottom: 0, left: -0.5,
                                    width: 1, height: stemH,
                                    background: typeColor,
                                    opacity: 0.4,
                                }}/>
                                {/* Card above stem */}
                                <div style={{
                                    position: "absolute",
                                    bottom: stemH,
                                    left: "50%",
                                    transform: isMsHover
                                        ? "translateX(-50%) scale(1.04)"
                                        : "translateX(-50%)",
                                    transformOrigin: "bottom center",
                                    width: 160,
                                    background: `color-mix(in srgb, ${typeColor} 13%, var(--bg))`,
                                    border: `1px solid ${typeColor}33`,
                                    borderRadius: "8px 8px 0 0",
                                    overflow: "hidden",
                                    userSelect: "none",
                                    transition: "transform 0.18s ease",
                                }}>
                                    {/* Full-opacity top bar */}
                                    <div style={{height: 3, background: typeColor}}/>
                                    <div style={{padding: "7px 10px 9px"}}>
                                        <p style={{
                                            fontSize: 9, fontWeight: 700, color: typeColor,
                                            letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 4,
                                        }}>
                                            {ms.type.replace(/_/g, " ")}
                                        </p>
                                        <p style={{
                                            fontSize: 13, fontWeight: 700, color: "var(--text-1)",
                                            lineHeight: 1.3, marginBottom: ms.description ? 4 : 5,
                                            display: "-webkit-box", WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical", overflow: "hidden",
                                        } as React.CSSProperties}>
                                            {ms.title}
                                        </p>
                                        {ms.description && (
                                            <p style={{
                                                fontSize: 11, color: "var(--text-3)", lineHeight: 1.4,
                                                marginBottom: 5,
                                                display: "-webkit-box", WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical", overflow: "hidden",
                                            } as React.CSSProperties}>
                                                {ms.description}
                                            </p>
                                        )}
                                        <p style={{fontSize: 11, color: "var(--text-4)", letterSpacing: "0.03em"}}>
                                            {dateStr}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Event stems + archival entries */}
                    {events.map((e, i) => {
                        const x = toX(new Date(e.startsAt), origin);
                        const STEMS = [14, 52, 90];
                        const stemH = STEMS[i % STEMS.length];
                        const typeColor = eventTypeColor(e.eventType);
                        const dateStr = new Date(e.startsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        });
                        const startStr = new Date(e.startsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short"
                        });
                        const endStr = new Date(e.endsAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        });
                        const sameDay = e.startsAt.slice(0, 10) === e.endsAt.slice(0, 10);
                        const dateRange = sameDay ? dateStr : `${startStr} – ${endStr}`;
                        const isHovered = hoveredItem?.kind === "event" && hoveredItem.data.id === e.id;

                        return (
                            <div
                                key={e.id}
                                style={{
                                    position: "absolute",
                                    left: x,
                                    top: trackY,
                                    transform: "translateX(-50%)",
                                    zIndex: hoveredItem?.kind === "event" && hoveredItem.data.id === e.id ? 10 : 2,
                                    cursor: "pointer",
                                }}
                                onMouseEnter={() => setHoveredItem({kind: "event", data: e, color: typeColor})}
                                onMouseLeave={() => setHoveredItem(null)}
                            >
                                {/* Hover info — above track */}
                                {isHovered && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: 24,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: 180,
                                        textAlign: "center",
                                        zIndex: 15,
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}>
                                        <p style={{
                                            fontSize: "2.6rem",
                                            fontWeight: 800,
                                            color: typeColor,
                                            lineHeight: 1,
                                            letterSpacing: "-0.05em"
                                        }}>
                                            {e._count.participations}
                                        </p>
                                        <p style={{
                                            fontSize: 10,
                                            color: "var(--text-4)",
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                            marginBottom: 10
                                        }}>
                                            volunteers
                                        </p>
                                        <p style={{
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "var(--text-2)",
                                            marginBottom: 2
                                        }}>
                                            {dateRange}
                                        </p>
                                        {e.locationName && (
                                            <p style={{fontSize: 11, color: "var(--text-3)"}}>{e.locationName}</p>
                                        )}
                                        <p style={{
                                            fontSize: 10,
                                            color: "var(--text-4)",
                                            letterSpacing: "0.08em",
                                            textTransform: "uppercase",
                                            marginTop: 4
                                        }}>
                                            {e.scope.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                )}
                                {/* Dot — colored by type */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: -5, left: -5,
                                        width: 10, height: 10,
                                        borderRadius: "50%",
                                        background: typeColor,
                                        border: "2px solid var(--bg)",
                                        zIndex: 1,
                                    }}
                                />
                                {/* Stem — type color at low opacity */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0, left: -0.5,
                                        width: 1,
                                        height: stemH,
                                        background: typeColor,
                                        opacity: 0.35,
                                    }}
                                />
                                {/* Archival entry */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: stemH,
                                        left: "50%",
                                        transform: isHovered
                                            ? "translateX(-50%) scale(1.04)"
                                            : "translateX(-50%)",
                                        transformOrigin: "top center",
                                        width: 155,
                                        background: `color-mix(in srgb, ${typeColor} 13%, var(--bg))`,
                                        border: `1px solid ${typeColor}33`,
                                        borderRadius: "0 0 8px 8px",
                                        overflow: "hidden",
                                        userSelect: "none",
                                        transition: "transform 0.18s ease",
                                    }}
                                >
                                    {/* Full-opacity top bar */}
                                    <div style={{height: 3, background: typeColor}}/>
                                    <div style={{padding: "7px 10px 9px"}}>
                                        {/* Type label */}
                                        <p style={{
                                            fontSize: 9, fontWeight: 700, color: typeColor,
                                            letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 4,
                                        }}>
                                            {e.eventType.replace(/_/g, " ")}
                                        </p>
                                        {/* Title */}
                                        <p style={{
                                            fontSize: 13, fontWeight: 700, color: "var(--text-1)",
                                            lineHeight: 1.3, marginBottom: 5,
                                            display: "-webkit-box", WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical", overflow: "hidden",
                                        } as React.CSSProperties}>
                                            {e.title}
                                        </p>
                                        {/* Date */}
                                        <p style={{fontSize: 11, color: "var(--text-4)", letterSpacing: "0.03em"}}>
                                            {dateStr}
                                        </p>
                                        {/* Location */}
                                        {e.locationName && (
                                            <p style={{
                                                fontSize: 11, color: "var(--text-3)", marginTop: 3,
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}>
                                                {e.locationName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Fixed cursor (doesn't translate) ─────────────────── */}
                <div
                    style={{
                        position: "absolute",
                        left: vw * CURSOR_F,
                        top: 0,
                        bottom: 0,
                        width: 2,
                        background: activeColor,
                        opacity: 0.85,
                        transition: "background 0.4s ease",
                        zIndex: 10,
                        pointerEvents: "none",
                    }}
                >
                    {/* Year pill on cursor */}
                    <div
                        style={{
                            position: "absolute",
                            top: trackY - 52,
                            left: 8,
                            background: activeColor,
                            color: "white",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 20,
                            letterSpacing: "0.1em",
                            whiteSpace: "nowrap",
                            transition: "background 0.4s ease",
                            userSelect: "none",
                        }}
                    >
                        {activeMandate?.academicYear ?? ""}
                    </div>
                </div>

                {/* ── Active mandate info — fixed corner ───────────── */}
                <div
                    style={{
                        position: "absolute",
                        ...(isMobile
                            ? {bottom: MOBILE_NAV_H + scrubberH + 24, right: 16, textAlign: "right"}
                            : {bottom: 64, left: 48}),
                        transition: "opacity 0.35s ease",
                        opacity: activeMandate ? 1 : 0,
                        pointerEvents: "none",
                        maxWidth: isMobile ? vw - 32 : undefined,
                    }}
                >
                    <div
                        style={{
                            fontSize: isMobile ? "2.2rem" : "clamp(4rem, 6vw, 6.5rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.055em",
                            lineHeight: 0.9,
                            color: activeColor,
                            transition: "color 0.4s ease",
                            tabularNums: true,
                        } as React.CSSProperties}
                    >
                        {String(activeMandateIdx + 1).padStart(2, "0")}
                    </div>
                    <div style={{height: 1, background: "var(--border)", margin: isMobile ? "8px 0" : "14px 0"}}/>
                    <p
                        style={{
                            fontSize: isMobile ? 13 : 18,
                            fontWeight: 700,
                            color: "var(--text-1)",
                            letterSpacing: "-0.02em",
                            marginBottom: 4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {activeMandate?.name}
                    </p>
                    <p
                        style={{
                            fontSize: 11,
                            color: "var(--text-4)",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                        }}
                    >
                        {activeMandate?._count.memberships} members · {activeMandate?._count.events} events
                    </p>
                    {activeMandate && !isMobile && (
                        <Link
                            href={`/mandates/${activeMandate.id}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                marginTop: 14,
                                fontSize: 13,
                                fontWeight: 600,
                                color: activeColor,
                                transition: "color 0.4s ease",
                                pointerEvents: "all",
                            }}
                        >
                            View mandate →
                        </Link>
                    )}
                </div>

                {/* ── Minimap (desktop only) ────────────────────────────── */}
                {!isMobile && (
                    <div
                        onClick={handleMinimapClick}
                        style={{
                            position: "absolute",
                            bottom: 20, right: 20,
                            width: MINIMAP_W, height: MINIMAP_H,
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            overflow: "hidden",
                            cursor: "pointer",
                            zIndex: 20,
                        }}
                    >
                        {mandates.map((m, i) => {
                            const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                            const x1 = toX(new Date(m.startsAt), origin) / totalWidth * MINIMAP_W;
                            const x2 = toX(mandateRanges[i].end, origin) / totalWidth * MINIMAP_W;
                            return (
                                <div key={m.id} style={{
                                    position: "absolute", left: x1, top: 0,
                                    width: Math.max(x2 - x1, 2), height: "100%",
                                    background: color, opacity: 0.25,
                                }}/>
                            );
                        })}
                        <div style={{position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--border-strong)"}}/>
                        {events.map((e) => {
                            const x = toX(new Date(e.startsAt), origin) / totalWidth * MINIMAP_W;
                            return (
                                <div key={e.id} style={{
                                    position: "absolute",
                                    left: x - 1.5, top: "50%", transform: "translateY(-50%)",
                                    width: 3, height: 3, borderRadius: "50%",
                                    background: eventTypeColor(e.eventType),
                                }}/>
                            );
                        })}
                        {milestones.map((ms) => {
                            const x = toX(new Date(ms.happenedAt), origin) / totalWidth * MINIMAP_W;
                            return (
                                <div key={ms.id} style={{
                                    position: "absolute",
                                    left: x - 3, top: "50%", transform: "translateY(-50%) rotate(45deg)",
                                    width: 5, height: 5, background: milestoneTypeColor(ms.type),
                                }}/>
                            );
                        })}
                        <div style={{
                            position: "absolute",
                            left: tx / totalWidth * MINIMAP_W, top: 0,
                            width: Math.max(vw / totalWidth * MINIMAP_W, 6), height: "100%",
                            background: activeColor, opacity: 0.18,
                            borderLeft: `2px solid ${activeColor}`,
                            transition: "left 0.1s linear, background 0.4s ease, border-color 0.4s ease",
                        }}/>
                    </div>
                )}

                {/* ── Mobile scrubber ───────────────────────────────────── */}
                {isMobile && (
                    <div
                        onPointerDown={handleScrubPointerDown}
                        onPointerMove={handleScrubPointerMove}
                        onPointerUp={handleScrubPointerUp}
                        onPointerCancel={handleScrubPointerUp}
                        style={{
                            position: "absolute",
                            bottom: MOBILE_NAV_H + 12,
                            left: 12, right: 12,
                            height: scrubberH,
                            background: "var(--surface-raised)",
                            border: "1px solid var(--border)",
                            borderRadius: scrubberH / 2,
                            overflow: "hidden",
                            zIndex: 25,
                            touchAction: "none",
                            cursor: "pointer",
                        }}
                    >
                        {/* Mandate colour bands */}
                        {mandates.map((m, i) => {
                            const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                            const x1 = toX(new Date(m.startsAt), origin) / totalWidth * (vw - 24);
                            const x2 = toX(mandateRanges[i].end, origin) / totalWidth * (vw - 24);
                            return (
                                <div key={m.id} style={{
                                    position: "absolute", left: x1, top: 0,
                                    width: Math.max(x2 - x1, 2), height: "100%",
                                    background: color, opacity: 0.25,
                                }}/>
                            );
                        })}
                        {/* Thumb */}
                        <div style={{
                            position: "absolute",
                            left: scrubThumbX,
                            top: 4,
                            width: scrubThumbW,
                            height: scrubberH - 8,
                            background: activeColor,
                            borderRadius: (scrubberH - 8) / 2,
                            transition: "background 0.4s ease",
                            pointerEvents: "none",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.22)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 3,
                        }}>
                            <div style={{width: 2, height: 12, borderRadius: 1, background: "rgba(255,255,255,0.45)"}}/>
                            <div style={{width: 2, height: 12, borderRadius: 1, background: "rgba(255,255,255,0.45)"}}/>
                            <div style={{width: 2, height: 12, borderRadius: 1, background: "rgba(255,255,255,0.45)"}}/>
                        </div>
                    </div>
                )}

                {/* ── Scroll hint (desktop only) ────────────────────────── */}
                {!isMobile && tx < 40 && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: 84, right: 48,
                            fontSize: 11,
                            color: "var(--text-4)",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            userSelect: "none",
                            animation: "pulse 2s infinite",
                        }}
                    >
                        Scroll to explore →
                    </div>
                )}
            </div>
        </div>
    );
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0] ?? "?").toUpperCase();
}
