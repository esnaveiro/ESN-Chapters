"use client";

import {useLayoutEffect, useMemo, useRef, useState} from "react";
import Link from "next/link";
import {MemberStatus} from "@/generated/prisma/enums";
import {STATUS_LABELS} from "@/lib/utils";

/* ── Exported types (used by page.tsx) ──────────────────────── */
export type BandMember = {
    id: string;
    slug: string;
    fullName: string;
    photoUrl: string | null;
    status: MemberStatus;
    joinedAt: Date;
    bio: string | null;
    favouriteMemory: string | null;
};
export type YearBand = { academicYear: string; color: string; members: BandMember[] };
export type BuddyConn = { buddyId: string; newbieId: string };

type Props = { yearBands: YearBand[]; buddyLinks: BuddyConn[] };

/* ── Status colours ─────────────────────────────────────────── */
const STATUS_COLOR: Record<MemberStatus, string> = {
    NEWBIE: "#d4943a",
    CANDIDATE_MEMBER: "#6aacb8",
    JUNIOR: "#7ac143",
    SENIOR: "#e0a800",
    ALUMNI: "#c47a8a",
};

/* ── Layout ─────────────────────────────────────────────────── */
const COL_W = 200;   // column width
const HDR_H = 56;    // coloured header height
const MEM_R = 22;    // circle radius
const MEM_STEP = 90;    // vertical spacing between members in a column

export function BuddyGraph({yearBands, buddyLinks}: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<BandMember | null>(null);
    const [hoveredYear, setHoveredYear] = useState<string | null>(null);
    const [h, setH] = useState(600);

    useLayoutEffect(() => {
        const update = () => {
            if (wrapRef.current) setH(wrapRef.current.clientHeight);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    /* ── Member (x, y) positions ────────────────────────────────── */
    const positions = useMemo(() => {
        const map = new Map<string, { x: number; y: number }>();
        const avail = h - HDR_H;

        yearBands.forEach((band, col) => {
            const N = band.members.length;
            const groupH = (N - 1) * MEM_STEP;
            const base = HDR_H + (avail - groupH) / 2;
            // Cycle through 5 distinct offsets so no two columns within a 5-mandate
            // window share the same y — prevents arrival segments from overlapping
            const stagger = (col % 5) * (MEM_STEP / 3);
            const startY = Math.max(HDR_H + 8, Math.min(h - 8 - groupH, base + stagger));

            band.members.forEach((m, i) => {
                map.set(m.id, {
                    x: col * COL_W + COL_W / 2,
                    y: startY + i * MEM_STEP,
                });
            });
        });
        return map;
    }, [yearBands, h]);

    /* ── Year hover: collect all IDs connected to the hovered band ── */
    const activeIds = useMemo<Set<string> | null>(() => {
        if (!hoveredYear) return null;
        const band = yearBands.find(b => b.academicYear === hoveredYear);
        if (!band) return null;
        const yearIds = new Set(band.members.map(m => m.id));
        const ids = new Set(yearIds);
        for (const l of buddyLinks) {
            if (yearIds.has(l.buddyId)) ids.add(l.newbieId);
            if (yearIds.has(l.newbieId)) ids.add(l.buddyId);
        }
        return ids;
    }, [hoveredYear, yearBands, buddyLinks]);

    /* ── Per-link routing: stagger midX by column, exitY by buddy ── */
    const linkRouting = useMemo(() => {
        // Pass 1 — unique midX per link within the same source column (sorted by target y)
        const byCol = new Map<number, { key: string; newbieId: string }[]>();
        for (const link of buddyLinks) {
            const pos = positions.get(link.buddyId);
            if (!pos) continue;
            const srcCol = Math.floor(pos.x / COL_W);
            const key = `${link.buddyId}→${link.newbieId}`;
            if (!byCol.has(srcCol)) byCol.set(srcCol, []);
            byCol.get(srcCol)!.push({key, newbieId: link.newbieId});
        }
        const midXMap = new Map<string, number>();
        for (const [srcCol, entries] of byCol) {
            entries.sort((a, b) => (positions.get(a.newbieId)?.y ?? 0) - (positions.get(b.newbieId)?.y ?? 0));
            const n = entries.length;
            entries.forEach(({key}, i) => {
                midXMap.set(key, (srcCol + 1) * COL_W + (i - (n - 1) / 2) * 10);
            });
        }

        // Pass 2 — unique exitY per link from the same buddy (fan within circle radius)
        const byBuddy = new Map<string, BuddyConn[]>();
        for (const link of buddyLinks) {
            if (!byBuddy.has(link.buddyId)) byBuddy.set(link.buddyId, []);
            byBuddy.get(link.buddyId)!.push(link);
        }
        const result = new Map<string, { exitY: number; midX: number }>();
        for (const [buddyId, links] of byBuddy) {
            const from = positions.get(buddyId);
            if (!from) continue;
            links.sort((a, b) => (positions.get(a.newbieId)?.y ?? 0) - (positions.get(b.newbieId)?.y ?? 0));
            const n = links.length;
            const step = n > 1 ? Math.min(11, (MEM_R * 1.6) / (n - 1)) : 0;
            links.forEach((link, i) => {
                const key = `${link.buddyId}→${link.newbieId}`;
                result.set(key, {
                    exitY: from.y + (i - (n - 1) / 2) * step,
                    midX: midXMap.get(key) ?? (Math.floor(from.x / COL_W) + 1) * COL_W,
                });
            });
        }
        return result;
    }, [buddyLinks, positions]);

    /* ── Orthogonal path fanned from exitY ───────────────────────── */
    function linkPath(
        from: { x: number; y: number },
        to: { x: number; y: number },
        exitY: number,
        midX: number,
    ): string {
        const ex = to.x - (MEM_R + 4);
        const dy = to.y - exitY;
        const r = Math.min(10, Math.abs(dy) / 2);

        if (Math.abs(dy) < 2) return `M${from.x},${exitY} H${ex}`;

        const s = dy > 0 ? 1 : -1;
        return [
            `M${from.x},${exitY}`,
            `H${midX - r}`,
            `Q${midX},${exitY} ${midX},${exitY + s * r}`,
            `V${to.y - s * r}`,
            `Q${midX},${to.y} ${midX + r},${to.y}`,
            `H${ex}`,
        ].join(" ");
    }

    const totalW = yearBands.length * COL_W;

    return (
        <div
            ref={wrapRef}
            style={{height: "100%", background: "var(--bg)", overflow: "hidden", position: "relative"}}
        >
            {/* ── Horizontally scrollable SVG ────────────────────── */}
            <div
                className="no-scrollbar"
                style={{width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden"}}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
                    const col = Math.floor(x / COL_W);
                    const year = yearBands[col]?.academicYear ?? null;
                    setHoveredYear(prev => prev === year ? prev : year);
                }}
                onMouseLeave={() => setHoveredYear(null)}
            >
                <svg width={totalW} height={h} style={{display: "block"}}>

                    {/* Clip paths for member photos */}
                    <defs>
                        {yearBands.flatMap(band =>
                            band.members.filter(m => m.photoUrl).map(m => (
                                <clipPath key={`cp-${m.id}`} id={`cp-${m.id}`}>
                                    <circle r={MEM_R - 1}/>
                                </clipPath>
                            ))
                        )}
                    </defs>

                    {/* ── Column backgrounds ─────────────────────────── */}
                    {yearBands.map((band, i) => (
                        <g key={`bg-${i}`}>
                            {i > 0 && (
                                <line
                                    x1={i * COL_W} y1={HDR_H}
                                    x2={i * COL_W} y2={h}
                                    stroke="var(--border)" strokeWidth={1}
                                />
                            )}
                            <rect
                                x={i * COL_W} y={HDR_H}
                                width={COL_W} height={h - HDR_H}
                                fill={`${band.color}${i % 2 === 0 ? "09" : "0e"}`}
                            />
                        </g>
                    ))}

                    {/* ── Buddy lines ────────────────────────────────── */}
                    {buddyLinks.map(conn => {
                        const from = positions.get(conn.buddyId);
                        const to = positions.get(conn.newbieId);
                        if (!from || !to) return null;

                        const key = `${conn.buddyId}→${conn.newbieId}`;
                        const routing = linkRouting.get(key);
                        const exitY = routing?.exitY ?? from.y;
                        const midX = routing?.midX ?? (Math.floor(from.x / COL_W) + 1) * COL_W;
                        const srcBand = yearBands.find(b => b.members.some(m => m.id === conn.buddyId));
                        const col = srcBand?.color ?? "#888";
                        const isActive = !activeIds || (activeIds.has(conn.buddyId) && activeIds.has(conn.newbieId));
                        const alpha = isActive ? (activeIds ? "bb" : "55") : "12";

                        return (
                            <path
                                key={key}
                                d={linkPath(from, to, exitY, midX)}
                                fill="none"
                                stroke={`${col}${alpha}`}
                                strokeWidth={isActive && activeIds ? 2 : 1.5}
                            />
                        );
                    })}

                    {/* ── Member nodes ───────────────────────────────── */}
                    {yearBands.flatMap(band =>
                        band.members.map(m => {
                            const pos = positions.get(m.id);
                            if (!pos) return null;
                            const sc = STATUS_COLOR[m.status];
                            const dimmed = activeIds && !activeIds.has(m.id);

                            return (
                                <g
                                    key={m.id}
                                    transform={`translate(${pos.x},${pos.y})`}
                                    style={{cursor: "pointer", opacity: dimmed ? 0.13 : 1, transition: "opacity 0.15s"}}
                                    onClick={() => setSelected(m)}
                                >
                                    <circle r={MEM_R + 6} fill={`${sc}09`}/>
                                    <circle r={MEM_R} fill="var(--bg)" stroke={sc} strokeWidth={1.5}/>
                                    {m.photoUrl ? (
                                        <image
                                            href={m.photoUrl}
                                            x={-(MEM_R - 1)} y={-(MEM_R - 1)}
                                            width={(MEM_R - 1) * 2} height={(MEM_R - 1) * 2}
                                            clipPath={`url(#cp-${m.id})`}
                                            style={{pointerEvents: "none"}}
                                        />
                                    ) : (
                                        <text
                                            textAnchor="middle" dominantBaseline="central"
                                            fill={sc} opacity={0.85} fontSize={10} fontWeight={700}
                                            style={{fontFamily: "Inter, system-ui, sans-serif", pointerEvents: "none"}}
                                        >
                                            {initials(m.fullName)}
                                        </text>
                                    )}
                                    <text
                                        y={MEM_R + 13} textAnchor="middle"
                                        fill="var(--text-3)" fontSize={10} fontWeight={500}
                                        style={{fontFamily: "Inter, system-ui, sans-serif", pointerEvents: "none"}}
                                    >
                                        {m.fullName.split(" ")[0]}
                                    </text>
                                </g>
                            );
                        })
                    )}

                    {/* ── Column headers (rendered last = on top) ────── */}
                    {yearBands.map((band, i) => (
                        <g key={`hdr-${i}`}>
                            <rect x={i * COL_W} y={0} width={COL_W} height={HDR_H} fill={band.color}/>
                            {i < yearBands.length - 1 && (
                                <line
                                    x1={(i + 1) * COL_W} y1={0}
                                    x2={(i + 1) * COL_W} y2={HDR_H}
                                    stroke="rgba(255,255,255,0.18)" strokeWidth={1}
                                />
                            )}
                            <text
                                x={i * COL_W + COL_W / 2} y={HDR_H * 0.38}
                                textAnchor="middle" dominantBaseline="central"
                                fill="rgba(255,255,255,0.95)" fontSize={12} fontWeight={700}
                                style={{fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.05em"}}
                            >
                                {band.academicYear}
                            </text>
                            <text
                                x={i * COL_W + COL_W / 2} y={HDR_H * 0.72}
                                textAnchor="middle" dominantBaseline="central"
                                fill="rgba(255,255,255,0.48)" fontSize={9}
                                style={{fontFamily: "Inter, system-ui, sans-serif"}}
                            >
                                {band.members.length} member{band.members.length !== 1 ? "s" : ""}
                            </text>
                        </g>
                    ))}

                </svg>
            </div>

            {/* ── Member panel ─────────────────────────────────────── */}
            {selected && (() => {
                const sc = STATUS_COLOR[selected.status];
                const bandColor = yearBands.find(b => b.members.some(m => m.id === selected.id))?.color ?? sc;
                const year = toAcademicYear(selected.joinedAt);
                const [first, ...rest] = selected.fullName.trim().split(" ");
                const last = rest.join(" ");

                return (
                    <div style={{
                        position: "absolute", right: 24, top: "50%",
                        transform: "translateY(-50%)",
                        width: 252,
                        maxHeight: "calc(100% - 48px)",
                        background: "var(--bg)",
                        borderRadius: 14,
                        zIndex: 10,
                        boxShadow: "0 16px 48px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
                        overflow: "hidden",
                        display: "flex", flexDirection: "column",
                    }}>

                        {/* ── Photo / colour header ── */}
                        {selected.photoUrl && (
                            <div style={{position: "relative", flexShrink: 0, overflow: "hidden", background: "#000"}}>
                                <img src={selected.photoUrl} alt=""
                                     style={{width: "100%", display: "block", objectFit: "cover"}}/>
                                {/* Bottom bar */}
                                <div style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: 3,
                                    background: bandColor
                                }}/>
                            </div>
                        )}
                        {!selected.photoUrl && (
                            <div style={{height: 3, flexShrink: 0, background: bandColor}}/>
                        )}

                        {/* ── Body ── */}
                        <div style={{padding: "14px 16px 18px", overflowY: "auto", flex: 1, position: "relative"}}>
                            <button onClick={() => setSelected(null)} style={{
                                position: "absolute", top: 10, right: 12,
                                width: 22, height: 22, borderRadius: "50%",
                                background: "var(--surface-raised)",
                                border: "none", color: "var(--text-3)", fontSize: 14, lineHeight: 1,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            }} aria-label="Close">×
                            </button>

                            {/* Name */}
                            <div style={{marginBottom: 8, paddingRight: 28}}>
                                <div style={{
                                    fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em",
                                    lineHeight: 1.05, color: "var(--text-1)"
                                }}>{first}</div>
                                {last && <div style={{
                                    fontSize: 13, fontWeight: 500, color: "var(--text-3)",
                                    letterSpacing: "-0.01em", lineHeight: 1.2
                                }}>{last}</div>}
                            </div>

                            {/* Status · year */}
                            <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 14}}>
                                <span
                                    style={{width: 7, height: 7, borderRadius: "50%", background: sc, flexShrink: 0}}/>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
                                    textTransform: "uppercase", color: sc
                                }}>{STATUS_LABELS[selected.status]}</span>
                                <span style={{color: "var(--text-4)", fontSize: 10}}>·</span>
                                <span style={{fontSize: 10, color: "var(--text-4)"}}>{year}</span>
                            </div>

                            {/* Bio */}
                            {selected.bio && (
                                <p style={{fontSize: 12, lineHeight: 1.7, color: "var(--text-2)", margin: "0 0 14px"}}>
                                    {selected.bio}
                                </p>
                            )}

                            {/* Favourite memory */}
                            {selected.favouriteMemory && (
                                <div style={{marginBottom: 16}}>
                                    <div style={{
                                        fontSize: 36, lineHeight: 0.75, fontFamily: "Georgia, serif",
                                        color: bandColor, opacity: 0.5, marginBottom: 4, userSelect: "none"
                                    }}>"
                                    </div>
                                    <p style={{
                                        fontSize: 11.5, lineHeight: 1.65, fontStyle: "italic",
                                        color: "var(--text-3)", margin: 0
                                    }}>{selected.favouriteMemory}</p>
                                </div>
                            )}

                            <Link href={`/members/${selected.slug}`} style={{
                                fontSize: 12, fontWeight: 600, color: bandColor,
                                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3,
                            }}>View profile →</Link>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : name[0] ?? "?").toUpperCase();
}

function toAcademicYear(date: Date): string {
    const m = date.getMonth();
    const y = date.getFullYear();
    return m >= 8 ? `${y}/${String(y + 1).slice(2)}` : `${y - 1}/${String(y).slice(2)}`;
}
