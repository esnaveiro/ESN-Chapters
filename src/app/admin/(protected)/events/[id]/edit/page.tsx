import {notFound} from "next/navigation";
import Link from "next/link";
import {prisma} from "@/lib/prisma";
import {EventForm} from "@/components/admin/EventForm";
import {DeleteButton} from "@/components/admin/DeleteButton";
import {deleteEvent} from "@/actions/events";

export default async function EditEventPage({
                                                params,
                                            }: {
    params: Promise<{ id: string }>;
}) {
    const {id} = await params;

    const [event, mandates] = await Promise.all([
        prisma.event.findUnique({
            where: {id},
            include: {mandate: {select: {id: true, name: true}}},
        }),
        prisma.mandate.findMany({
            orderBy: {startsAt: "desc"},
            select: {id: true, name: true},
        }),
    ]);

    if (!event) notFound();

    return (
        <div className="max-w-[600px]">
            <Link
                href="/admin/events"
                className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-4)] no-underline hover:text-[var(--text-2)] transition-colors mb-6 inline-block"
            >
                ← Events
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-8 mt-2">
                <h1 className="text-[28px] font-bold text-[var(--text-1)] tracking-[-0.02em] leading-none">
                    {event.title}
                </h1>
                <DeleteButton
                    confirmText={`Permanently delete "${event.title}"?`}
                    redirectTo="/admin/events"
                    action={deleteEvent.bind(null, event.id)}
                />
            </div>

            <EventForm
                mode="edit"
                eventId={event.id}
                mandates={mandates}
                defaultValues={{
                    title: event.title,
                    description: event.description ?? "",
                    locationName: event.locationName ?? "",
                    startsAt: event.startsAt.toISOString().split("T")[0],
                    endsAt: event.endsAt.toISOString().split("T")[0],
                    eventType: event.eventType,
                    scope: event.scope,
                    mandateId: event.mandate?.id ?? "",
                    showOnTimeline: event.showOnTimeline,
                }}
            />
        </div>
    );
}
