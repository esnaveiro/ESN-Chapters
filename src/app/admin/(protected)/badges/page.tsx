import {prisma} from "@/lib/prisma";
import {BadgeManager} from "@/components/admin/BadgeManager";

export default async function AdminBadgesPage() {
    const badges = await prisma.badge.findMany({
        orderBy: {name: "asc"},
        include: {memberBadges: {select: {id: true}}},
    });

    return (
        <div>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8">
                Badges
            </h1>
            <BadgeManager badges={badges}/>
        </div>
    );
}
