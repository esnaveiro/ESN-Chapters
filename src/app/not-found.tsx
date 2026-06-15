import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex-1 flex items-center justify-center px-4 py-24 text-center">
            <div className="max-w-sm">
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[var(--text-4)] mb-2">
                    404
                </p>
                <h1 className="text-[var(--text-2xl)] font-bold text-[var(--text-1)] tracking-[-0.01em] mb-3">
                    Page not found
                </h1>
                <p className="text-[14px] text-[var(--text-3)] mb-6">
                    The page you’re looking for doesn’t exist or may have moved.
                </p>
                <Link
                    href="/"
                    className="text-[13px] font-semibold text-[var(--accent)] hover:text-[var(--accent-dark)] transition-colors"
                >
                    ← Back home
                </Link>
            </div>
        </main>
    );
}
