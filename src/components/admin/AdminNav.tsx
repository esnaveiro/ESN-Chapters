"use client";

import Link from "next/link";
import Image from "next/image";
import {usePathname} from "next/navigation";
import {Award, Flag, FolderOpen, Heart, LayoutDashboard, type LucideIcon, Settings, Users,} from "lucide-react";
import {APP_TITLE, NAV_TITLE_ACCENT, NAV_TITLE_REST} from "@/lib/config";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
    {href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true},
    {href: "/admin/members", label: "Members", icon: Users},
    {href: "/admin/mandates", label: "Mandates", icon: FolderOpen},
    {href: "/admin/milestones", label: "Milestones", icon: Flag},
    {href: "/admin/badges", label: "Badges", icon: Award},
    {href: "/admin/tributes", label: "Tributes", icon: Heart},
    {href: "/admin/settings", label: "Settings", icon: Settings},
];

const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(item => item.href !== "/admin/tributes");

export function AdminNav({email}: { email: string }) {
    const pathname = usePathname();

    return (
        <>
            {/* ── Desktop sidebar ───────────────────────────────── */}
            <aside className="hidden md:flex w-[184px] shrink-0 flex-col min-h-screen border-r border-[var(--border)] bg-[var(--surface)]">
                {/* Logo */}
                <div className="px-5 pt-6 pb-4 border-b border-[var(--border)]">
                    <Link href="/" className="no-underline block">
                        <p className="text-[13px] font-bold tracking-[-0.01em] text-[var(--text-1)]">
                            {APP_TITLE}
                        </p>
                    </Link>
                    <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-4)] mt-0.5">
                        Admin
                    </p>
                </div>

                {/* Nav items */}
                <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
                    {NAV_ITEMS.map(({href, label, icon: Icon, exact}) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={[
                                    "flex items-center gap-2.5 px-2.5 py-[7px] rounded-[var(--radius-md)] text-[13px] no-underline transition-colors duration-100",
                                    active
                                        ? "bg-[var(--surface-raised)] text-[var(--text-1)] font-semibold"
                                        : "text-[var(--text-3)] font-normal hover:text-[var(--text-2)] hover:bg-[var(--surface-raised)]",
                                ].join(" ")}
                            >
                                <Icon size={14} strokeWidth={active ? 2.2 : 1.8}/>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-2.5 pt-3 pb-4 border-t border-[var(--border)]">
                    <p className="px-2.5 text-[11px] text-[var(--text-4)] truncate mb-1.5">{email}</p>
                    <form action="/admin/logout" method="post">
                        <button
                            type="submit"
                            className="w-full text-left px-2.5 py-[7px] rounded-[var(--radius-md)] text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--surface-raised)] transition-colors duration-100"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>

            {/* ── Mobile top header ────────────────────────────── */}
            <header
                className="md:hidden fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 border-b border-[var(--border)]"
                style={{background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)"}}
            >
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-semibold tracking-tight no-underline text-[var(--text-1)]"
                    style={{letterSpacing: "-0.01em"}}
                >
                    <Image src="/icons/icon-192.png" alt={APP_TITLE} width={24} height={24} className="rounded-[4px]"/>
                    <span style={{color: "var(--accent)"}}>{NAV_TITLE_ACCENT}</span>
                    {NAV_TITLE_REST && <span> {NAV_TITLE_REST}</span>}
                </Link>
                <span className="ml-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-4)]">Admin</span>
                <form action="/admin/logout" method="post" className="ml-auto">
                    <button
                        type="submit"
                        className="p-2 text-[var(--text-4)] hover:text-[var(--text-2)] transition-colors"
                        aria-label="Sign out"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
                            <path d="M10 11l3-3-3-3"/>
                            <line x1="13" y1="8" x2="6" y2="8"/>
                        </svg>
                    </button>
                </form>
            </header>

            {/* ── Mobile bottom nav ─────────────────────────────── */}
            <nav
                className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)]"
                style={{
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(12px)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                }}
            >
                <div className="h-14 flex items-center">
                    {MOBILE_NAV_ITEMS.map(({href, label, icon: Icon, exact}) => {
                        const active = exact ? pathname === href : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex-1 flex flex-col items-center gap-0.5 py-2 no-underline"
                                style={{color: active ? "var(--accent)" : "var(--text-3)"}}
                            >
                                <Icon size={20} strokeWidth={active ? 2.2 : 1.8}/>
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
