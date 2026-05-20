"use client";

import {useEffect, useState} from "react";
import {Button} from "@/components/ui/Button";

type Props = {
    photoUrl: string;
    focusX: number;
    focusY: number;
    onChange: (x: number, y: number) => void;
};

export function PhotoFocusPicker({photoUrl, focusX, focusY, onChange}: Props) {
    const [open, setOpen] = useState(false);
    const [draftX, setDraftX] = useState(focusX);
    const [draftY, setDraftY] = useState(focusY);
    const [dragging, setDragging] = useState(false);

    function openModal() {
        setDraftX(focusX);
        setDraftY(focusY);
        setOpen(true);
    }

    function apply() {
        onChange(draftX, draftY);
        setOpen(false);
    }

    function cancel() {
        setOpen(false);
    }

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") cancel();
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    function getPercent(e: React.PointerEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100))),
            y: Math.min(100, Math.max(0, Math.round(((e.clientY - rect.top) / rect.height) * 100))),
        };
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        const {x, y} = getPercent(e);
        setDraftX(x);
        setDraftY(y);
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!dragging) return;
        const {x, y} = getPercent(e);
        setDraftX(x);
        setDraftY(y);
    }

    function handlePointerUp() {
        setDragging(false);
    }

    return (
        <>
            {/* Inline trigger — mini folder preview + button */}
            <div className="flex items-center gap-3">
                <div className="overflow-hidden shrink-0" style={{width: 80, height: 48, borderRadius: 6}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={photoUrl}
                        alt=""
                        style={{width: "100%", height: "100%", objectFit: "cover", objectPosition: `${focusX}% ${focusY}%`}}
                    />
                </div>
                <div className="flex flex-col gap-0.5">
                    <Button type="button" size="sm" variant="secondary" onClick={openModal}>
                        Adjust crop
                    </Button>
                    <p className="text-[11px] text-[var(--text-4)]">{focusX}% {focusY}%</p>
                </div>
            </div>

            {/* Modal */}
            {open && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"}}
                    onClick={cancel}
                >
                    <div
                        className="bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
                        style={{maxHeight: "90vh", animation: "modal-in 0.15s ease"}}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
                            <p className="text-[14px] font-semibold text-[var(--text-1)]">Adjust crop</p>
                            <button
                                type="button"
                                onClick={cancel}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-raised)] transition-colors text-[13px]"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="overflow-y-auto flex flex-col gap-5 p-5">
                            {/* Full photo picker */}
                            <div>
                                <p className="text-[11px] text-[var(--text-4)] mb-2">Click or drag to set focal point</p>
                                <div
                                    className="relative rounded-[var(--radius-md)] overflow-hidden cursor-crosshair select-none"
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photoUrl}
                                        alt=""
                                        draggable={false}
                                        className="w-full h-auto block pointer-events-none"
                                    />
                                    <div className="absolute inset-0 bg-black/25 pointer-events-none"/>
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{left: `${draftX}%`, top: `${draftY}%`, transform: "translate(-50%, -50%)"}}
                                    >
                                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
                                             style={{filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))"}}>
                                            <circle cx="14" cy="14" r="5" stroke="white" strokeWidth="1.5"
                                                    fill="rgba(255,255,255,0.25)"/>
                                            <line x1="14" y1="0" x2="14" y2="9" stroke="white" strokeWidth="1.5"
                                                  strokeLinecap="round"/>
                                            <line x1="14" y1="19" x2="14" y2="28" stroke="white" strokeWidth="1.5"
                                                  strokeLinecap="round"/>
                                            <line x1="0" y1="14" x2="9" y2="14" stroke="white" strokeWidth="1.5"
                                                  strokeLinecap="round"/>
                                            <line x1="19" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1.5"
                                                  strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Folder preview */}
                            <div>
                                <p className="text-[11px] text-[var(--text-4)] mb-2">
                                    Folder preview <span className="opacity-60">({draftX}% {draftY}%)</span>
                                </p>
                                <div className="overflow-hidden" style={{height: 190, borderRadius: 10}}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photoUrl}
                                        alt=""
                                        draggable={false}
                                        className="pointer-events-none"
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            objectPosition: `${draftX}% ${draftY}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2 px-5 py-4 border-t border-[var(--border)] shrink-0">
                            <Button type="button" onClick={apply}>Apply</Button>
                            <Button type="button" variant="secondary" onClick={cancel}>Cancel</Button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes modal-in {
                            from { opacity: 0; transform: scale(0.96) translateY(4px); }
                            to   { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}
