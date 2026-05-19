import Link from "next/link";
import Image from "next/image";
import {MemberStatus} from "@/generated/prisma/enums";
import {StatusBadge} from "@/components/ui/Badge";

type Props = {
    member: {
        id: string;
        slug: string;
        fullName: string;
        photoUrl: string | null;
        joinedAt: Date;
        leftAt: Date | null;
        statusHistory: { endedAt: Date | null; status: MemberStatus }[];
    };
    mandateColorIndex?: number;
};

export function MemberCard({member}: Props) {
    const status =
        member.statusHistory.find((s) => !s.endedAt)?.status ?? ("NEWBIE" as MemberStatus);

    const joinYear = new Date(member.joinedAt).getFullYear();
    const endYear = member.leftAt ? new Date(member.leftAt).getFullYear() : new Date().getFullYear();
    const yearsLabel = endYear > joinYear ? `${endYear - joinYear}y` : String(joinYear);

    const initials = member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("");

    return (
        <Link
            href={`/members/${member.slug}`}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-100 hover:bg-[var(--surface-raised)]"
            style={{borderColor: "var(--border)"}}
        >
            <div
                className="shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold"
                style={{width: 38, height: 38, background: "var(--surface-sunken)", color: "var(--text-3)"}}
            >
                {member.photoUrl ? (
                    <Image src={member.photoUrl} alt={member.fullName} width={38} height={38}
                           className="object-cover w-full h-full"/>
                ) : initials}
            </div>

            <div className="flex-1 min-w-0">
                <p
                    className="font-medium truncate leading-tight"
                    style={{fontSize: "var(--text-sm)", color: "var(--text-1)"}}
                >
                    {member.fullName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusBadge status={status}/>
                    <span style={{fontSize: 11, color: "var(--text-4)"}}>{yearsLabel}</span>
                </div>
            </div>
        </Link>
    );
}
