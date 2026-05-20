"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {getMandateColor} from "@/lib/utils";

type Mandate = {
    id: string;
    name: string;
    academicYear: string;
    photoUrl: string | null;
    photoFocusX: number;
    photoFocusY: number;
    colorIndex: number;
    customColor?: string | null;
    _count: { memberships: number; events: number };
};

const TAB_H = 42;
const TAB_W = 158;
const TAB_STEP = 44;
const INITIAL_OFFSET = 20;
const BODY_OPEN = 400;
const TAB_OVERLAP = 8;

function tabClipPath(w: number) {
    return `path('M 0 ${TAB_H} L 10 7 Q 12 0 19 0 L ${w - 19} 0 Q ${w - 12} 0 ${w - 10} 7 L ${w} ${TAB_H} Z')`;
}

export function MandateLedger({mandates}: { mandates: Mandate[] }) {
    const [openId, setOpenId] = useState<string>(mandates[0]?.id ?? "");
    const [windowW, setWindowW] = useState(1280);

    useEffect(() => {
        const update = () => setWindowW(window.innerWidth);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const n = mandates.length;
    const activeIdx = mandates.findIndex((m) => m.id === openId);
    const active = mandates[activeIdx];
    const activeColor = active
        ? getMandateColor(active.colorIndex ?? activeIdx, active.customColor)
        : "var(--accent)";

    const isMobile = windowW < 1024;

    // Scale tab dimensions to fit available screen width
    const availableW = windowW - (isMobile ? 24 : 32);
    const desktopTotal = INITIAL_OFFSET + Math.max(0, n - 1) * TAB_STEP + TAB_W;
    const scale = isMobile && desktopTotal > availableW ? availableW / desktopTotal : 1;
    const dynTabW = Math.max(80, Math.floor(TAB_W * scale));
    const dynTabStep = Math.max(16, Math.floor(TAB_STEP * scale));

    return (
        <div
            className="w-full h-full"
            style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
                gap: isMobile ? 0 : "clamp(32px, 5vw, 80px)",
            }}
        >
            {/* ── Info panel (desktop only) ─────────────────────────── */}
            {!isMobile && (
                <div className="flex flex-col py-20 overflow-hidden">
                    <div
                        className="font-bold tabular-nums leading-none"
                        style={{
                            fontSize: "clamp(7rem, 11vw, 10rem)",
                            letterSpacing: "-0.055em",
                            color: activeColor,
                            transition: "color 0.35s ease",
                            lineHeight: 0.9,
                        }}
                    >
                        {String(activeIdx + 1).padStart(2, "0")}
                    </div>

                    <div className="my-6" style={{height: 1, background: "var(--border)"}}/>

                    <p
                        className="font-semibold leading-snug mb-1"
                        style={{fontSize: "clamp(1rem, 1.4vw, 1.2rem)", color: "var(--text-1)"}}
                    >
                        {active?.name}
                    </p>
                    <p
                        className="uppercase tracking-widest mb-8"
                        style={{fontSize: 11, color: "var(--text-4)", letterSpacing: "0.12em"}}
                    >
                        {active?.academicYear}
                    </p>

                    <div className="flex gap-8 mb-8">
                        <div>
                            <p className="uppercase tracking-widest mb-1"
                               style={{fontSize: 10, color: "var(--text-4)"}}>Members</p>
                            <p className="font-bold tabular-nums leading-none"
                               style={{fontSize: "clamp(1.8rem, 2.5vw, 2.5rem)", letterSpacing: "-0.04em", color: "var(--text-1)"}}>
                                {active?._count.memberships ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="uppercase tracking-widest mb-1"
                               style={{fontSize: 10, color: "var(--text-4)"}}>Events</p>
                            <p className="font-bold tabular-nums leading-none"
                               style={{fontSize: "clamp(1.8rem, 2.5vw, 2.5rem)", letterSpacing: "-0.04em", color: "var(--text-1)"}}>
                                {active?._count.events ?? "—"}
                            </p>
                        </div>
                    </div>

                    {active && (
                        <Link
                            href={`/mandates/${active.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
                            style={{color: activeColor, transition: "color 0.35s ease"}}
                        >
                            View mandate →
                        </Link>
                    )}

                    <div className="mt-auto pt-16">
                        <p className="uppercase tracking-widest"
                           style={{fontSize: 11, color: "var(--text-4)", letterSpacing: "0.08em"}}>
                            {n} mandate{n !== 1 ? "s" : ""} on record
                        </p>
                    </div>
                </div>
            )}

            {/* ── Folder stack ─────────────────────────────────────── */}
            <div
                className="no-scrollbar"
                style={{scrollbarWidth: "none", height: "100%", overflowY: isMobile ? "hidden" : "auto"}}
            >
                <div style={{
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    paddingBottom: isMobile ? 0 : "5rem",
                }}>
                    {mandates.map((m, i) => {
                        const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                        const prevColor = i > 0
                            ? getMandateColor(mandates[i - 1].colorIndex ?? i - 1, mandates[i - 1].customColor)
                            : null;
                        const isOpen = openId === m.id;

                        return (
                            <div
                                key={m.id}
                                className="relative select-none"
                                style={{
                                    paddingTop: TAB_H,
                                    marginTop: i === 0 ? 0 : -TAB_OVERLAP,
                                    zIndex: i + 1,
                                    cursor: "pointer",
                                }}
                                onMouseEnter={!isMobile ? () => setOpenId(m.id) : undefined}
                                onClick={
                                    isMobile
                                        ? (!isOpen ? () => setOpenId(m.id) : undefined)
                                        : () => { window.location.href = `/mandates/${m.id}`; }
                                }
                            >
                                {prevColor && (
                                    <>
                                        <div className="absolute inset-x-0 top-0"
                                             style={{height: TAB_H, background: prevColor}}/>
                                        <div className="absolute"
                                             style={{left: 0, top: TAB_H, width: 12, height: 12, background: prevColor}}/>
                                        <div className="absolute"
                                             style={{right: 0, top: TAB_H, width: 12, height: 12, background: prevColor}}/>
                                    </>
                                )}

                                {/* Tab */}
                                <div
                                    className="absolute top-0 flex items-center justify-center"
                                    style={{
                                        left: i * dynTabStep + INITIAL_OFFSET,
                                        width: dynTabW,
                                        height: TAB_H,
                                        background: color,
                                        clipPath: tabClipPath(dynTabW),
                                    }}
                                >
                                    <span
                                        className="text-white font-semibold uppercase truncate px-3"
                                        style={{fontSize: 11, letterSpacing: "0.14em", maxWidth: dynTabW - 24}}
                                    >
                                        {m.academicYear}
                                    </span>
                                </div>

                                {/* Folder body */}
                                <div
                                    style={{
                                        position: "relative",
                                        zIndex: 1,
                                        marginTop: -1,
                                        height: isOpen ? BODY_OPEN : CLOSED_H,
                                        transition: "height 0.44s cubic-bezier(0.16, 1, 0.3, 1)",
                                        background: color,
                                        borderRadius: 12,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div style={{opacity: isOpen ? 1 : 0, transition: "opacity 0.25s 0.1s"}}>
                                        <div className="flex items-center gap-5 px-7 h-16">
                                            <span className="font-semibold text-white flex-1 truncate"
                                                  style={{fontSize: 16}}>
                                                {m.name}
                                            </span>
                                            <span className="text-white/55 tabular-nums whitespace-nowrap"
                                                  style={{fontSize: 13}}>
                                                {m._count.memberships} members · {m._count.events} events
                                            </span>
                                            <Link
                                                href={`/mandates/${m.id}`}
                                                className="ml-2 text-white/75 hover:text-white transition-colors shrink-0 font-medium"
                                                style={{fontSize: 13}}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                Open →
                                            </Link>
                                        </div>

                                        <div className="px-7 pb-7">
                                            {m.photoUrl ? (
                                                <div className="relative overflow-hidden mb-5"
                                                     style={{borderRadius: 10, height: 190}}>
                                                    <Image src={m.photoUrl} alt={m.name} fill
                                                           className="object-cover"
                                                           style={{objectPosition: `${m.photoFocusX}% ${m.photoFocusY}%`}}/>
                                                    <div className="absolute inset-0"
                                                         style={{background: "rgba(0,0,0,0.12)"}}/>
                                                </div>
                                            ) : (
                                                <div className="mb-5 flex items-center justify-center"
                                                     style={{height: 190, borderRadius: 10, background: "rgba(255,255,255,0.1)"}}>
                                                    <span className="text-white/25 text-sm">No photo</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-8">
                                                    <div>
                                                        <p className="text-white/45 text-xs uppercase tracking-wider mb-0.5">Members</p>
                                                        <p className="text-white font-bold tabular-nums"
                                                           style={{fontSize: "1.6rem", letterSpacing: "-0.03em"}}>
                                                            {m._count.memberships}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white/45 text-xs uppercase tracking-wider mb-0.5">Events</p>
                                                        <p className="text-white font-bold tabular-nums"
                                                           style={{fontSize: "1.6rem", letterSpacing: "-0.03em"}}>
                                                            {m._count.events}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link
                                                    href={`/mandates/${m.id}`}
                                                    className="text-sm font-semibold px-5 py-2.5 rounded-xl"
                                                    style={{background: "rgba(255,255,255,0.2)", color: "white"}}
                                                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
                                                    onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    View mandate
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

const CLOSED_H = 28;
