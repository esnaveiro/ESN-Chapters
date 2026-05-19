import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {MilestoneForm} from "@/components/admin/MilestoneForm";

export default async function NewMilestonePage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        select: {id: true, name: true},
    });

    return (
        <div className="max-w-[600px]">
            <Link
                href="/admin/milestones"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Milestones
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8 mt-2">
                New milestone
            </h1>
            <MilestoneForm mode="create" mandates={mandates}/>
        </div>
    );
}
