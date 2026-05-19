import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {Button} from "@/components/ui/Button";
import {getMandateColor} from "@/lib/utils";

export default async function AdminMandatesPage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        include: {_count: {select: {memberships: true, events: true}}},
    });

    const totalVolunteers = mandates.reduce((sum, m) => sum + m._count.memberships, 0);
    const totalEvents = mandates.reduce((sum, m) => sum + m._count.events, 0);

    return (
        <div>
            <div className="flex items-start justify-between mb-6">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    Mandates
                </h1>
                <Link href="/admin/mandates/new">
                    <Button size="sm">Create mandate</Button>
                </Link>
            </div>

            {/* Stats strip */}
            <div className="flex gap-6 mb-8 pb-6 border-b border-[var(--border)]">
                {[
                    {value: mandates.length, label: "mandates"},
                    {value: totalVolunteers, label: "volunteer slots"},
                    {value: totalEvents, label: "events"},
                ].map(({value, label}) => (
                    <div key={label}>
                        <p className="text-[22px] font-bold text-[var(--text-1)] leading-none tabular-nums">
                            {value}
                        </p>
                        <p className="text-[11px] text-[var(--text-4)] mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {mandates.length === 0 ? (
                <p className="text-[13px] text-[var(--text-4)] py-10">No mandates yet.</p>
            ) : (
                <div>
                    {mandates.map((mandate, i) => {
                        const color = getMandateColor(mandate.colorIndex, mandate.customColor);
                        return (
                            <div
                                key={mandate.id}
                                className="flex items-center gap-4 py-4 border-b border-[var(--border)] last:border-0"
                            >
                <span className="text-[11px] tabular-nums text-[var(--text-4)] w-7 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                                <div className="w-2 h-2 rounded-full shrink-0" style={{background: color}}/>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] tabular-nums font-medium text-[var(--text-4)] leading-none mb-0.5">
                                        {mandate.academicYear}
                                    </p>
                                    <p className="text-[14px] font-semibold text-[var(--text-1)] truncate">
                                        {mandate.name}
                                    </p>
                                </div>
                                <p className="text-[11px] text-[var(--text-4)] shrink-0">
                                    {mandate._count.memberships} vol.
                                    <span className="mx-1.5 text-[var(--border-strong)]">·</span>
                                    {mandate._count.events} events
                                </p>
                                <Link
                                    href={`/admin/mandates/${mandate.id}/edit`}
                                    className="text-[11px] text-[var(--text-3)] hover:text-[var(--text-1)] no-underline transition-colors shrink-0"
                                >
                                    Edit
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
