import {prisma} from "@/lib/prisma";
import {EventManager} from "@/components/admin/EventManager";

export default async function AdminEventsPage() {
    const events = await prisma.event.findMany({
        orderBy: {startsAt: "desc"},
        include: {
            mandate: {select: {id: true, name: true}},
            _count: {select: {participations: true}},
        },
    });

    return (
        <div>
            <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none mb-8">
                Events
            </h1>
            <EventManager events={events}/>
        </div>
    );
}
