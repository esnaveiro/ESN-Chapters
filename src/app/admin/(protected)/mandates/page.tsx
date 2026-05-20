import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {Button} from "@/components/ui/Button";
import {MandatesManager} from "@/components/admin/MandatesManager";

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

            <MandatesManager mandates={mandates} />
        </div>
    );
}
