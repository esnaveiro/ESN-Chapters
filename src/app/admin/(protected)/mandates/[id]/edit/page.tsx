import {notFound} from "next/navigation";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {MandateForm} from "@/components/admin/MandateForm";
import {MandateMembersManager} from "@/components/admin/MandateMembersManager";
import {MandateMilestoneManager} from "@/components/admin/MandateMilestoneManager";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {deleteMandate} from "@/actions/mandates";

export default async function EditMandatePage({
                                                  params,
                                              }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [mandate, allMembers] = await Promise.all([
        prisma.mandate.findUnique({
            where: {id},
            include: {
                memberships: {
                    include: {member: {select: {id: true, fullName: true}}},
                    orderBy: {department: "asc"},
                },
                milestones: {orderBy: {happenedAt: "asc"}},
            },
        }),
        prisma.member.findMany({
            orderBy: {fullName: "asc"},
            select: {id: true, fullName: true},
        }),
    ]);

    if (!mandate) notFound();

    return (
        <div>
            <Link
                href="/admin/mandates"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Mandates
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8 mt-2">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    {mandate.name}
                </h1>
                <DeleteButton
                    confirmText={`Permanently delete "${mandate.name}"? This will also remove all memberships and milestones linked to it.`}
                    redirectTo="/admin/mandates"
                    action={deleteMandate.bind(null, mandate.id)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                <section>
                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                        Mandate details
                    </p>
                    <MandateForm
                        mode="edit"
                        mandateId={mandate.id}
                        formId="mandate-details"
                        hideActions
                        defaultValues={{
                            name: mandate.name,
                            academicYear: mandate.academicYear,
                            startsAt: mandate.startsAt.toISOString(),
                            endsAt: mandate.endsAt?.toISOString(),
                            photoUrl: mandate.photoUrl ?? "",
                            photoFocusX: mandate.photoFocusX,
                            photoFocusY: mandate.photoFocusY,
                            colorIndex: mandate.colorIndex,
                            customColor: mandate.customColor ?? "",
                        }}
                    />
                </section>

                <section>
                    <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                        Team{" "}
                        <span className="font-normal normal-case tracking-normal text-[var(--text-4)]">
              ({mandate.memberships.length})
            </span>
                    </p>
                    <MandateMembersManager
                        mandateId={mandate.id}
                        memberships={mandate.memberships}
                        allMembers={allMembers}
                    />
                </section>
            </div>

            <div className="my-10"/>

            <section>
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)] mb-6">
                    Milestones{" "}
                    <span className="font-normal normal-case tracking-normal text-[var(--text-4)]">
                        ({mandate.milestones.length})
                    </span>
                </p>
                <MandateMilestoneManager
                    mandateId={mandate.id}
                    milestones={mandate.milestones}
                />
            </section>

            <div className="border-t border-[var(--border)] mt-12 mb-8"/>

            <div className="flex gap-3">
                <button
                    type="submit"
                    form="mandate-details"
                    className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
                >
                    Save changes
                </button>
                <Link
                    href="/admin/mandates"
                    className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] text-[13px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-raised)] transition-colors no-underline"
                >
                    Cancel
                </Link>
            </div>
        </div>
    );
}
