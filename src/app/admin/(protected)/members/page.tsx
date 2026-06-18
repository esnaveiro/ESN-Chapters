import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {Button} from "@/components/ui/Button";
import {MembersRoster} from "@/components/admin/MembersRoster";

export default async function AdminMembersPage() {
    const members = await prisma.member.findMany({
        orderBy: {fullName: "asc"},
        include: {statusHistory: {orderBy: {startedAt: "desc"}, take: 1}},
    });

    return (
        <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    Members
                </h1>
                <div className="flex items-center gap-2">
                    <Link href="/admin/members/import">
                        <Button size="sm" variant="secondary">Import from Excel</Button>
                    </Link>
                    <Link href="/admin/members/new">
                        <Button size="sm">Add member</Button>
                    </Link>
                </div>
            </div>

            <MembersRoster members={members}/>
        </div>
    );
}
