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

const TAB_H = 34;
const BODY_CLOSED = 58;
const BODY_OPEN = 300;

export function MandateStack({mandates}: { mandates: Mandate[] }) {
    const [openId, setOpenId] = useState<string>(mandates[0]?.id ?? "");

    return (
        <div className="w-full">
            {mandates.map((m, i) => {
                const color = getMandateColor(m.colorIndex ?? i, m.customColor);
                const isOpen = openId === m.id;
                const bodyH = isOpen ? BODY_OPEN : BODY_CLOSED;

                /* darken for text contrast on white text */
                const tabColor = color;

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
                        {/* ─── Tab ─────────────────────────────────── */}
                        <div
                            className="absolute top-0 left-0 flex items-center gap-2.5 px-4"
                            style={{
                                height: TAB_H,
                                minWidth: 148,
                                background: tabColor,
                                borderRadius: "8px 8px 0 0",
                                opacity: isOpen ? 1 : 0.88,
                                transition: "opacity 0.2s",
                            }}
                        >
              <span
                  className="text-white font-semibold tracking-widest uppercase"
                  style={{fontSize: 11, letterSpacing: "0.12em"}}
              >
                {m.academicYear}
              </span>
                        </div>

                        {/* ─── Folder body ─────────────────────────── */}
                        <div
                            className="overflow-hidden"
                            style={{
                                background: color,
                                borderRadius: "0 var(--radius-folder) var(--radius-folder) var(--radius-folder)",
                                height: bodyH,
                                transition: "height 0.42s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s",
                                boxShadow: isOpen
                                    ? "0 24px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)"
                                    : "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                        >
                            {/* Always-visible header row */}
                            <div className="flex items-center gap-4 px-6 h-[58px]">
                <span
                    className="font-semibold text-white flex-1 truncate"
                    style={{fontSize: 15}}
                >
                  {m.name}
                </span>
                                <span
                                    className="text-white/60 tabular-nums whitespace-nowrap"
                                    style={{fontSize: 13}}
                                >
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

                            {/* Expanded content */}
                            <div
                                className="px-6 pb-6"
                                style={{
                                    opacity: isOpen ? 1 : 0,
                                    transition: "opacity 0.25s 0.1s",
                                }}
                            >
                                {m.photoUrl ? (
                                    <div
                                        className="relative overflow-hidden mb-4"
                                        style={{borderRadius: 8, height: 120}}
                                    >
                                        <Image
                                            src={m.photoUrl}
                                            alt={m.name}
                                            fill
                                            className="object-cover"
                                        />
                                        <div
                                            className="absolute inset-0"
                                            style={{background: "rgba(0,0,0,0.15)"}}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="mb-4"
                                        style={{
                                            height: 120,
                                            borderRadius: 8,
                                            background: "rgba(255,255,255,0.12)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <span className="text-white/30 text-sm">No photo</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-5">
                                        <div>
                                            <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Members</p>
                                            <p className="text-white font-semibold text-xl tabular-nums">
                                                {m._count.memberships}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">Events</p>
                                            <p className="text-white font-semibold text-xl tabular-nums">
                                                {m._count.events}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/mandates/${m.id}`}
                                        className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                                        style={{
                                            background: "rgba(255,255,255,0.18)",
                                            color: "white",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.background = "rgba(255,255,255,0.26)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
                                        }
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
    );
}
