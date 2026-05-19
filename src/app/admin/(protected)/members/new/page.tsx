import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {MemberForm} from "@/components/admin/MemberForm";

export default async function NewMemberPage() {
    const members = await prisma.member.findMany({
        orderBy: {fullName: "asc"},
        select: {id: true, fullName: true},
    });

    return (
        <div>
            <Link
                href="/admin/members"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Members
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8 mt-2">
                Add member
            </h1>
            <MemberForm mode="create" members={members}/>
        </div>
    );
}
