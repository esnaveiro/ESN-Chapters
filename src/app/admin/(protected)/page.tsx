import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {StatusBadge} from "@/components/ui/Badge";

export default async function AdminDashboard() {
    const [memberCount, mandateCount, milestoneCount, tributeCount, recentMembers] =
        await Promise.all([
            prisma.member.count(),
            prisma.mandate.count(),
            prisma.milestone.count(),
            prisma.tribute.count(),
            prisma.member.findMany({
                orderBy: {createdAt: "desc"},
                take: 8,
                select: {id: true, fullName: true, slug: true, statusHistory: {orderBy: {startedAt: "desc"}, take: 1, select: {status: true}}},
            }),
        ]);

    return (
        <div>
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-3">
                    Overview
                </h1>
                <p className="text-[13px] text-[var(--text-3)]">
                    <span className="text-[var(--text-1)] font-semibold">{memberCount}</span>{" "}members
                    <span className="mx-2 text-[var(--text-4)]">·</span>
                    <span className="text-[var(--text-1)] font-semibold">{mandateCount}</span>{" "}mandates
                    <span className="mx-2 text-[var(--text-4)]">·</span>
                    <span className="text-[var(--text-1)] font-semibold">{milestoneCount}</span>{" "}milestones
                    <span className="mx-2 text-[var(--text-4)]">·</span>
                    <span className="text-[var(--text-1)] font-semibold">{tributeCount}</span>{" "}tributes
                </p>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mb-12">
                {[
                    {label: "Add member", href: "/admin/members/new"},
                    {label: "Create mandate", href: "/admin/mandates/new"},
                    {label: "Add milestone", href: "/admin/milestones"},
                    {label: "Manage badges", href: "/admin/badges"},
                ].map(({label, href}) => (
                    <Link
                        key={label}
                        href={href}
                        className="px-3 py-1.5 rounded-[var(--radius-md)] text-[12px] font-medium text-[var(--text-2)] bg-[var(--surface-raised)] hover:bg-[var(--border)] no-underline transition-colors duration-100"
                    >
                        {label}
                    </Link>
                ))}
            </div>

            {/* Recently added */}
            <div>
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-5">
                    Recently added
                </p>

                {recentMembers.length === 0 ? (
                    <p className="text-[13px] text-[var(--text-4)] py-6">No members yet.</p>
                ) : (
                    <>
                        <div>
                            {recentMembers.map((member, i) => {
                                const status = member.statusHistory[0]?.status ?? "NEWBIE";
                                return (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0"
                                    >
                    <span className="text-[11px] tabular-nums text-[var(--text-4)] w-5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                                        <div
                                            className="w-7 h-7 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-3)] shrink-0">
                                            {member.fullName.charAt(0)}
                                        </div>
                                        <p className="flex-1 min-w-0 text-[13px] font-medium text-[var(--text-1)] truncate">
                                            {member.fullName}
                                        </p>
                                        <StatusBadge status={status}/>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Link
                                                href={`/admin/members/${member.id}/edit`}
                                                className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] no-underline transition-colors"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/members/${member.slug}`}
                                                target="_blank"
                                                className="text-[11px] text-[var(--text-4)] hover:text-[var(--text-1)] no-underline transition-colors"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-5">
                            <Link
                                href="/admin/members"
                                className="text-[12px] text-[var(--text-3)] hover:text-[var(--text-1)] no-underline transition-colors"
                            >
                                All members →
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
