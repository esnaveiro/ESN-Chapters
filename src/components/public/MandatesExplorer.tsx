"use client";

import {useState} from "react";
import Link from "next/link";
import Image from "next/image";
import {getMandateColor} from "@/lib/utils";

type Mandate = {
    id: string;
    name: string;
    academicYear: string;
    photoUrl: string | null;
    colorIndex: number;
    customColor?: string | null;
    _count: { memberships: number; events: number };
};

type Variant = "ledger" | "billboard" | "archive";

const VARIANTS: { id: Variant; label: string }[] = [
    {id: "ledger", label: "A · Ledger"},
    {id: "billboard", label: "B · Billboard"},
    {id: "archive", label: "D · Archive"},
];

// ─── A: Ledger ────────────────────────────────────────────────────────────────
const TAB_H = 34;
const BODY_CLOSED = 58;
const BODY_OPEN = 300;

function LedgerView({mandates, openId, setOpenId}: {
    mandates: Mandate[];
    openId: string;
    setOpenId: (id: string) => void
}) {
    const activeIdx = mandates.findIndex((m) => m.id === openId);
    const active = mandates[activeIdx];
    const color = active ? getMandateColor(active.colorIndex ?? activeIdx, active.customColor) : "var(--accent)";

    return (
        <div className="grid gap-16" style={{gridTemplateColumns: "200px 1fr", alignItems: "start"}}>
            {/* Left: sticky index panel */}
            <div className="sticky top-24">
                <div
                    className="font-bold tabular-nums leading-none mb-5"
                    style={{
                        fontSize: "clamp(5rem, 8vw, 7rem)",
                        letterSpacing: "-0.05em",
                        color,
                        transition: "color 0.3s"
                    }}
                >
                    {String(activeIdx + 1).padStart(2, "0")}
                </div>
                <p className="font-semibold leading-tight mb-1" style={{fontSize: 17, color: "var(--text-1)"}}>
                    {active?.name}
                </p>
                <p className="uppercase tracking-widest mb-6"
                   style={{fontSize: 11, color: "var(--text-4)", letterSpacing: "0.1em"}}>
                    {active?.academicYear}
                </p>
                <div className="flex gap-6 mb-6">
                    <div>
                        <p className="uppercase tracking-widest mb-0.5"
                           style={{fontSize: 10, color: "var(--text-4)"}}>Members</p>
                        <p className="font-semibold tabular-nums" style={{color: "var(--text-1)", fontSize: 22}}>
                            {active?._count.memberships ?? "—"}
                        </p>
                    </div>
                    <div>
                        <p className="uppercase tracking-widest mb-0.5"
                           style={{fontSize: 10, color: "var(--text-4)"}}>Events</p>
                        <p className="font-semibold tabular-nums" style={{color: "var(--text-1)", fontSize: 22}}>
                            {active?._count.events ?? "—"}
                        </p>
                    </div>
                </div>
                {active && (
                    <Link
                        href={`/mandates/${active.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-60"
                        style={{color: "var(--accent)"}}
                    >
                        View mandate →
                    </Link>
                )}
            </div>

            {/* Right: folder stack */}
            <div className="w-full">
                {mandates.map((m, i) => {
                    const c = getMandateColor(m.colorIndex ?? i, m.customColor);
                    const isOpen = openId === m.id;

                    return (
                        <div
                            key={m.id}
                            className="relative select-none"
                            style={{
                                paddingTop: TAB_H,
                                marginTop: i === 0 ? 0 : 6,
                                zIndex: isOpen ? 20 : mandates.length - i,
                            }}
                            onMouseEnter={() => setOpenId(m.id)}
                        >
                            <div
                                className="absolute top-0 left-0 flex items-center gap-2.5 px-4"
                                style={{
                                    height: TAB_H,
                                    minWidth: 148,
                                    background: c,
                                    borderRadius: "8px 8px 0 0",
                                    opacity: isOpen ? 1 : 0.88,
                                    transition: "opacity 0.2s",
                                }}
                            >
                <span className="text-white font-semibold uppercase" style={{fontSize: 11, letterSpacing: "0.12em"}}>
                  {m.academicYear}
                </span>
                            </div>

                            <div
                                className="overflow-hidden"
                                style={{
                                    background: c,
                                    borderRadius: "0 var(--radius-folder) var(--radius-folder) var(--radius-folder)",
                                    height: isOpen ? BODY_OPEN : BODY_CLOSED,
                                    transition: "height 0.42s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s",
                                    boxShadow: isOpen
                                        ? "0 24px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)"
                                        : "0 2px 8px rgba(0,0,0,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-4 px-6 h-[58px]">
                  <span className="font-semibold text-white flex-1 truncate" style={{fontSize: 15}}>
                    {m.name}
                  </span>
                                    <span className="text-white/60 tabular-nums whitespace-nowrap"
                                          style={{fontSize: 13}}>
                    {m._count.memberships} members · {m._count.events} events
                  </span>
                                    <Link
                                        href={`/mandates/${m.id}`}
                                        className="ml-2 text-white/80 hover:text-white transition-colors shrink-0"
                                        style={{fontSize: 13}}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Open →
                                    </Link>
                                </div>
                                <div className="px-6 pb-6"
                                     style={{opacity: isOpen ? 1 : 0, transition: "opacity 0.25s 0.1s"}}>
                                    {m.photoUrl ? (
                                        <div className="relative overflow-hidden mb-4"
                                             style={{borderRadius: 8, height: 120}}>
                                            <Image src={m.photoUrl} alt={m.name} fill className="object-cover"/>
                                            <div className="absolute inset-0" style={{background: "rgba(0,0,0,0.15)"}}/>
                                        </div>
                                    ) : (
                                        <div className="mb-4 flex items-center justify-center" style={{
                                            height: 110,
                                            borderRadius: 8,
                                            background: "rgba(255,255,255,0.12)"
                                        }}>
                                            <span className="text-white/30 text-sm">No photo</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-5">
                                            <div>
                                                <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Members</p>
                                                <p className="text-white font-semibold text-xl tabular-nums">{m._count.memberships}</p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Events</p>
                                                <p className="text-white font-semibold text-xl tabular-nums">{m._count.events}</p>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/mandates/${m.id}`}
                                            className="text-sm font-medium px-4 py-2 rounded-lg"
                                            style={{background: "rgba(255,255,255,0.18)", color: "white"}}
                                        >
                                            View mandate
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── B: Billboard ─────────────────────────────────────────────────────────────
function BillboardView({mandates, openId, setOpenId}: {
    mandates: Mandate[];
    openId: string;
    setOpenId: (id: string) => void
}) {
    return (
        <div className="flex flex-col gap-3">
            {mandates.map((m, i) => {
                const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                const isOpen = openId === m.id;

                return (
                    <div
                        key={m.id}
                        className="relative overflow-hidden cursor-pointer select-none"
                        style={{
                            borderRadius: 14,
                            background: color,
                            height: isOpen ? 460 : 64,
                            transition: "height 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s",
                            boxShadow: isOpen
                                ? "0 32px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.1)"
                                : "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                        onMouseEnter={() => setOpenId(m.id)}
                    >
                        {/* Year watermark */}
                        <div
                            className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden"
                            style={{paddingRight: "5%"}}
                        >
              <span
                  className="font-bold tabular-nums leading-none"
                  style={{
                      fontSize: "clamp(7rem, 16vw, 14rem)",
                      letterSpacing: "-0.05em",
                      color: "rgba(255,255,255,0.07)",
                      opacity: isOpen ? 1 : 0,
                      transition: "opacity 0.4s 0.15s",
                      userSelect: "none",
                  }}
              >
                {m.academicYear}
              </span>
                        </div>

                        {/* Always-visible header */}
                        <div className="relative flex items-center gap-5 px-8 h-16">
              <span
                  className="font-semibold text-white truncate flex-1"
                  style={{fontSize: isOpen ? 18 : 15, transition: "font-size 0.3s"}}
              >
                {m.name}
              </span>
                            <span className="text-white/40 text-xs uppercase tracking-widest shrink-0">
                {m.academicYear}
              </span>
                            <span className="text-white/50 text-sm tabular-nums shrink-0">
                {m._count.memberships} · {m._count.events}
              </span>
                            <Link
                                href={`/mandates/${m.id}`}
                                className="text-white/70 hover:text-white text-sm font-medium transition-colors shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Open →
                            </Link>
                        </div>

                        {/* Expanded */}
                        <div
                            className="relative px-8 pb-8"
                            style={{opacity: isOpen ? 1 : 0, transition: "opacity 0.3s 0.2s"}}
                        >
                            <div
                                className="grid gap-8"
                                style={{gridTemplateColumns: "1fr 220px"}}
                            >
                                <div>
                                    {m.photoUrl ? (
                                        <div className="relative overflow-hidden"
                                             style={{borderRadius: 10, height: 140}}>
                                            <Image src={m.photoUrl} alt={m.name} fill className="object-cover"/>
                                            <div className="absolute inset-0" style={{background: "rgba(0,0,0,0.12)"}}/>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center" style={{
                                            height: 160, borderRadius: 10, background: "rgba(255,255,255,0.10)"
                                        }}>
                                            <span className="text-white/25 text-sm">No photo</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center gap-6">
                                    <div>
                                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Members</p>
                                        <p className="text-white font-bold tabular-nums leading-none"
                                           style={{fontSize: "clamp(2.5rem, 4vw, 3.5rem)", letterSpacing: "-0.04em"}}>
                                            {m._count.memberships}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Events</p>
                                        <p className="text-white font-bold tabular-nums leading-none"
                                           style={{fontSize: "clamp(2.5rem, 4vw, 3.5rem)", letterSpacing: "-0.04em"}}>
                                            {m._count.events}
                                        </p>
                                    </div>
                                    <Link
                                        href={`/mandates/${m.id}`}
                                        className="self-start text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
                                        style={{background: "rgba(255,255,255,0.2)", color: "white"}}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View mandate →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── D: Archive ───────────────────────────────────────────────────────────────
function ArchiveView({mandates, openId, setOpenId}: {
    mandates: Mandate[];
    openId: string;
    setOpenId: (id: string) => void
}) {
    const activeIdx = mandates.findIndex((m) => m.id === openId);
    const activeColor = activeIdx >= 0 ? getMandateColor(mandates[activeIdx].colorIndex ?? activeIdx, mandates[activeIdx].customColor) : "";
    const bgTint = activeColor ? `${activeColor}0d` : "transparent";

    return (
        <div
            className="overflow-hidden border"
            style={{
                borderRadius: 16,
                borderColor: "var(--border)",
                background: bgTint,
                transition: "background 0.6s ease",
            }}
        >
            {mandates.map((m, i) => {
                const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                const isOpen = openId === m.id;

                return (
                    <div
                        key={m.id}
                        className="border-b last:border-b-0"
                        style={{borderColor: "var(--border)"}}
                    >
                        {/* Tab row */}
                        <div
                            className="flex items-center gap-5 px-8 cursor-pointer select-none"
                            style={{height: 72}}
                            onMouseEnter={() => setOpenId(m.id)}
                        >
                            <div
                                className="shrink-0 rounded-full"
                                style={{
                                    width: 8,
                                    height: 8,
                                    background: color,
                                    opacity: isOpen ? 1 : 0.35,
                                    transition: "opacity 0.2s",
                                }}
                            />
                            <span
                                className="font-bold tabular-nums shrink-0"
                                style={{
                                    fontSize: "1.5rem",
                                    letterSpacing: "-0.035em",
                                    color: isOpen ? color : "var(--text-3)",
                                    transition: "color 0.25s",
                                    minWidth: 90,
                                }}
                            >
                {m.academicYear}
              </span>
                            <span
                                className="font-medium flex-1 truncate"
                                style={{
                                    fontSize: 15,
                                    color: isOpen ? "var(--text-1)" : "var(--text-3)",
                                    transition: "color 0.25s",
                                }}
                            >
                {m.name}
              </span>
                            <span
                                className="tabular-nums text-sm shrink-0"
                                style={{color: isOpen ? "var(--text-2)" : "var(--text-4)", transition: "color 0.25s"}}
                            >
                {m._count.memberships} members · {m._count.events} events
              </span>
                            <svg
                                className="shrink-0"
                                style={{
                                    transform: isOpen ? "rotate(90deg)" : "none",
                                    transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                                    color: isOpen ? color : "var(--text-4)",
                                }}
                                width={16} height={16} viewBox="0 0 16 16" fill="none"
                            >
                                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"
                                      strokeLinejoin="round"/>
                            </svg>
                        </div>

                        {/* Expanded body */}
                        <div
                            className="overflow-hidden"
                            style={{
                                height: isOpen ? 260 : 0,
                                transition: "height 0.42s cubic-bezier(0.16, 1, 0.3, 1)",
                            }}
                        >
                            <div className="px-8 pb-8">
                                <div className="flex gap-8">
                                    <div className="flex-1">
                                        {m.photoUrl ? (
                                            <div className="relative overflow-hidden"
                                                 style={{borderRadius: 8, height: 120}}>
                                                <Image src={m.photoUrl} alt={m.name} fill className="object-cover"/>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center justify-center"
                                                style={{height: 140, borderRadius: 8, background: `${color}18`}}
                                            >
                                                <span style={{fontSize: 13, color: `${color}60`}}>No photo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col justify-center gap-5 shrink-0" style={{width: 160}}>
                                        <div>
                                            <p className="uppercase tracking-widest mb-1"
                                               style={{fontSize: 10, color: "var(--text-4)"}}>Members</p>
                                            <p className="font-bold tabular-nums leading-none"
                                               style={{fontSize: "2.5rem", letterSpacing: "-0.04em", color}}>
                                                {m._count.memberships}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="uppercase tracking-widest mb-1"
                                               style={{fontSize: 10, color: "var(--text-4)"}}>Events</p>
                                            <p className="font-bold tabular-nums leading-none"
                                               style={{fontSize: "2.5rem", letterSpacing: "-0.04em", color}}>
                                                {m._count.events}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/mandates/${m.id}`}
                                            className="text-sm font-medium transition-opacity hover:opacity-60"
                                            style={{color}}
                                        >
                                            View mandate →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function MandatesExplorer({mandates}: { mandates: Mandate[] }) {
    const [variant, setVariant] = useState<Variant>("ledger");
    const [openId, setOpenId] = useState<string>(mandates[0]?.id ?? "");

    return (
        <div>
            {/* Variant switcher */}
            <div
                className="inline-flex items-center gap-1 mb-12 p-1 rounded-xl border"
                style={{borderColor: "var(--border)", background: "var(--surface-raised)"}}
            >
                {VARIANTS.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setVariant(v.id)}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: variant === v.id ? "white" : "transparent",
                            color: variant === v.id ? "var(--text-1)" : "var(--text-3)",
                            boxShadow: variant === v.id ? "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)" : "none",
                        }}
                    >
                        {v.label}
                    </button>
                ))}
            </div>

            {variant === "ledger" && <LedgerView mandates={mandates} openId={openId} setOpenId={setOpenId}/>}
            {variant === "billboard" && <BillboardView mandates={mandates} openId={openId} setOpenId={setOpenId}/>}
            {variant === "archive" && <ArchiveView mandates={mandates} openId={openId} setOpenId={setOpenId}/>}
        </div>
    );
}
