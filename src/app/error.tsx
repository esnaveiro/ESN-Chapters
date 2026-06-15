"use client";

import {useEffect} from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
            <div className="max-w-sm">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text-4)] mb-2">
                    Something went wrong
                </p>
                <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text-1)] tracking-[-0.01em] mb-3">
                    Unexpected error
                </h1>
                <p className="text-[14px] text-[var(--text-3)] mb-6">
                    An error occurred while loading this page. You can try again.
                </p>
                <button
                    onClick={reset}
                    className="text-[13px] font-semibold text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                >
                    Try again
                </button>
            </div>
        </main>
    );
}
