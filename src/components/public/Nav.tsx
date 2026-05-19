"use client";

import Link from "next/link";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {APP_TITLE, NAV_TITLE_ACCENT, NAV_TITLE_REST} from "@/lib/config";

const LINKS = [
    {href: "/members", label: "Members"},
    {href: "/mandates", label: "Mandates"},
    {href: "/timeline", label: "Timeline"},
    {href: "/graph", label: "Network"},
];

export function Nav() {
    const path = usePathname();

    return (
        <>
            <header
                className="sticky top-0 z-50 h-14 flex items-center border-b border-[var(--border)]"
                style={{background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)"}}
            >
                <div className="w-full mx-auto px-6 flex items-center gap-8" style={{maxWidth: 1100}}>
                    <Link
                        href="/"
                        className="shrink-0 flex items-center gap-2 text-sm font-semibold tracking-tight no-underline text-[var(--text-1)]"
                        style={{letterSpacing: "-0.01em"}}
                    >
                        <Image src="/icons/icon-192.png" alt={APP_TITLE} width={24} height={24}
                               className="rounded-[4px]"/>
                        {NAV_TITLE_ACCENT}{NAV_TITLE_REST ? ` ${NAV_TITLE_REST}` : ""}
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 flex-1">
                        {LINKS.map(({href, label}) => {
                            const active = path.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className="px-3 py-1.5 rounded-md text-sm transition-colors duration-100"
                                    style={{
                                        color: active ? "var(--text-1)" : "var(--text-3)",
                                        background: active ? "var(--surface-raised)" : "transparent",
                                        fontWeight: active ? 500 : 400,
                                    }}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>

                    <Link
                        href="/admin"
                        className="shrink-0 text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors no-underline"
                        aria-label="Admin"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="7" width="10" height="7" rx="1.5"/>
                            <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
                        </svg>
                    </Link>
                </div>
            </header>

            {/* Mobile bottom bar */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 h-14 flex items-center border-t border-[var(--border)]"
                style={{background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)"}}
            >
                {LINKS.map(({href, label}) => {
                    const active = path.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className="flex-1 flex flex-col items-center gap-0.5 text-xs py-2"
                            style={{color: active ? "var(--accent)" : "var(--text-3)", fontWeight: active ? 600 : 400}}
                        >
                            {label}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
