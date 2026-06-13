import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {EventForm} from "@/components/admin/EventForm";

export default async function NewEventPage() {
    const mandates = await prisma.mandate.findMany({
        orderBy: {startsAt: "desc"},
        select: {id: true, name: true},
    });

    return (
        <div className="max-w-[600px]">
            <Link
                href="/admin/events"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Events
            </Link>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8 mt-2">
                New event
            </h1>
            <EventForm mode="create" mandates={mandates}/>
        </div>
    );
}
