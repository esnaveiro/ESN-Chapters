import {notFound} from "next/navigation";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {BadgeForm} from "@/components/admin/BadgeForm";
import {BadgeAwardManager} from "@/components/admin/BadgeAwardManager";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {deleteBadge} from "@/actions/badges";

export default async function EditBadgePage({
                                                params,
                                            }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [badge, members] = await Promise.all([
        prisma.badge.findUnique({
            where: {id},
            include: {
                memberBadges: {
                    include: {member: {select: {id: true, slug: true, fullName: true}}},
                    orderBy: {awardedAt: "desc"},
                },
            },
        }),
        prisma.member.findMany({
            orderBy: {fullName: "asc"},
            select: {id: true, fullName: true},
        }),
    ]);

    if (!badge) notFound();

    return (
        <div>
            <Link
                href="/admin/badges"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Badges
            </Link>

            <div className="flex items-start justify-between gap-4 mb-8 mt-2">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    {badge.name}
                </h1>
                <DeleteButton
                    confirmText={`Permanently delete "${badge.name}"? This will also remove all awards.`}
                    redirectTo="/admin/badges"
                    action={deleteBadge.bind(null, badge.id)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <section>
                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                        Badge details
                    </p>
                    <BadgeForm
                        mode="edit"
                        badgeId={badge.id}
                        defaultValues={{
                            name: badge.name,
                            description: badge.description ?? "",
                            icon: badge.icon ?? "",
                        }}
                    />
                </section>

                <section>
                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                        Awards{" "}
                        <span className="font-normal normal-case tracking-normal text-[var(--text-4)]">
              ({badge.memberBadges.length})
            </span>
                    </p>
                    <BadgeAwardManager
                        badgeId={badge.id}
                        memberBadges={badge.memberBadges}
                        members={members}
                    />
                </section>
            </div>
        </div>
    );
}
