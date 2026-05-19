"use client";

import {useEffect, useState} from "react";
import Image from "next/image";

type Props = {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
};

export function PhotoZoom({src, alt, width, height, className}: Props) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="block w-full h-full cursor-zoom-in"
                aria-label={`View photo of ${alt}`}
            >
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={className}
                />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center"
                    style={{background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)"}}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="relative max-w-[90vw] max-h-[90vh]"
                        style={{animation: "zoom-in 0.18s ease"}}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={src}
                            alt={alt}
                            className="block rounded-lg object-contain"
                            style={{maxWidth: "90vw", maxHeight: "90vh"}}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close"
                        className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-white transition-colors"
                        style={{background: "rgba(255,255,255,0.12)"}}
                    >
                        ✕
                    </button>
                </div>
            )}

            <style>{`
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </>
    );
}
