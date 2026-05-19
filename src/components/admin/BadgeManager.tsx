import Link from "next/link";
import {BadgeIcon} from "@/components/ui/BadgeIcon";
import {Button} from "@/components/ui/Button";

type Badge = {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    memberBadges: { id: string }[];
};

type Props = {
    badges: Badge[];
};

export function BadgeManager({badges}: Props) {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--text-4)]">
                    {badges.length} {badges.length === 1 ? "badge" : "badges"} defined
                </p>
                <Link href="/admin/badges/new">
                    <Button size="sm" variant="secondary">New badge</Button>
                </Link>
            </div>

            {badges.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-6">No badges defined yet.</p>
            ) : (
                <div>
                    {badges.map((badge) => (
                        <div key={badge.id}
                             className="flex items-center gap-3 py-4 border-b border-[var(--border)] last:border-0">
                            {badge.icon ? (
                                <div
                                    className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--surface-raised)] flex items-center justify-center shrink-0 text-[var(--text-2)]">
                                    <BadgeIcon name={badge.icon} size={15}/>
                                </div>
                            ) : (
                                <div className="w-8 h-8 shrink-0"/>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[var(--text-1)]">{badge.name}</p>
                                {badge.description && (
                                    <p className="text-[12px] text-[var(--text-3)] mt-0.5">{badge.description}</p>
                                )}
                            </div>
                            <span className="text-[11px] tabular-nums text-[var(--text-4)] shrink-0">
                {badge.memberBadges.length} awarded
              </span>
                            <Link
                                href={`/admin/badges/${badge.id}/edit`}
                                className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors shrink-0"
                            >
                                Edit
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
