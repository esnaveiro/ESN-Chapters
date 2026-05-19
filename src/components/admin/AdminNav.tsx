"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {Award, Flag, FolderOpen, LayoutDashboard, type LucideIcon, Settings, Users,} from "lucide-react";
import {APP_TITLE} from "@/lib/config";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
    {href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true},
    {href: "/admin/members", label: "Members", icon: Users},
    {href: "/admin/mandates", label: "Mandates", icon: FolderOpen},
    {href: "/admin/milestones", label: "Milestones", icon: Flag},
    {href: "/admin/badges", label: "Badges", icon: Award},
    {href: "/admin/settings", label: "Settings", icon: Settings},
];

export function AdminNav({email}: { email: string }) {
    const pathname = usePathname();

    return (
        <aside
            className="w-[184px] shrink-0 flex flex-col min-h-screen border-r border-[var(--border)] bg-[var(--surface)]">
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
    );
}
