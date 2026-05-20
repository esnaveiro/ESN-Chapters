import {notFound} from "next/navigation";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {MilestoneForm} from "@/components/admin/MilestoneForm";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {deleteMilestone} from "@/actions/milestones";

export default async function EditMilestonePage({
                                                    params,
                                                }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [milestone, mandates] = await Promise.all([
        prisma.milestone.findUnique({
            where: {id},
            include: {mandate: {select: {id: true, name: true}}},
        }),
        prisma.mandate.findMany({
            orderBy: {startsAt: "desc"},
            select: {id: true, name: true},
        }),
    ]);

    if (!milestone) notFound();

    return (
        <div className="max-w-[600px]">
            <Link
                href="/admin/milestones"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Milestones
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8 mt-2">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    {milestone.title}
                </h1>
                <DeleteButton
                    confirmText={`Permanently delete "${milestone.title}"?`}
                    redirectTo="/admin/milestones"
                    action={deleteMilestone.bind(null, milestone.id)}
                />
            </div>

            <MilestoneForm
                mode="edit"
                milestoneId={milestone.id}
                mandates={mandates}
                defaultValues={{
                    title: milestone.title,
                    description: milestone.description ?? "",
                    happenedAt: milestone.happenedAt.toISOString().split("T")[0],
                    type: milestone.type,
                    mandateId: milestone.mandate?.id ?? "",
                }}
            />
        </div>
    );
}
