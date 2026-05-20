import {prisma} from "@/lib/prisma";
import {TributeForm} from "@/components/admin/TributeForm";
import {TributeList} from "@/components/admin/TributeList";

export default async function AdminTributesPage() {
    const [tributes, allMembers] = await Promise.all([
        prisma.tribute.findMany({
            orderBy: {createdAt: "desc"},
            include: {
                author: {select: {id: true, fullName: true, slug: true}},
                recipient: {select: {id: true, fullName: true, slug: true}},
            },
        }),
        prisma.member.findMany({
            orderBy: {fullName: "asc"},
            select: {id: true, fullName: true},
        }),
    ]);

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    Tributes
                </h1>
                <p className="text-[13px] text-[var(--text-4)] tabular-nums pt-1">
                    {tributes.length} {tributes.length === 1 ? "tribute" : "tributes"}
                </p>
            </div>

            <TributeForm allMembers={allMembers} />

            <TributeList tributes={tributes} />
        </div>
    );
}
