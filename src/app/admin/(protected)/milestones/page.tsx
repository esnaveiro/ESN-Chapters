import {prisma} from "@/lib/prisma";
import {MilestoneManager} from "@/components/admin/MilestoneManager";

export default async function AdminMilestonesPage() {
    const milestones = await prisma.milestone.findMany({
        orderBy: {happenedAt: "desc"},
        include: {mandate: {select: {id: true, name: true}}},
    });

    return (
        <div>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8">
                Milestones
            </h1>
            <MilestoneManager milestones={milestones}/>
        </div>
    );
}
