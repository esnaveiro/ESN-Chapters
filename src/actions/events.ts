"use server";

import {prisma} from "@/lib/prisma";
import {actionError, requireAuth} from "@/lib/auth";
import {optionalDate, optionalText, optionalUrl, requireDate, requireEnum, requireText} from "@/lib/validation";
import {EventScope, EventType} from "@/generated/prisma/enums";
import {revalidatePath} from "next/cache";
import {ActionResult} from "@/types";

/** Validates the full set of fields required to create an event. */
function requireEventData(data: EventFormData) {
    requireText(data.title, "Title", 200);
    requireEnum(data.scope, EventScope, "Scope");
    requireEnum(data.eventType, EventType, "Event type");
    requireDate(data.startsAt, "Start date");
    requireDate(data.endsAt, "End date");
    optionalUrl(data.coverPhotoUrl, "Cover photo URL");
    optionalText(data.description, "Description");
    optionalText(data.locationName, "Location", 200);
}

export type EventFormData = {
    title: string;
    description?: string;
    coverPhotoUrl?: string;
    locationName?: string;
    scope: EventScope;
    eventType: EventType;
    startsAt: string;
    endsAt: string;
    mandateId?: string;
    showOnTimeline?: boolean;
};

export async function createEvent(
    data: EventFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        requireEventData(data);
        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description || null,
                coverPhotoUrl: data.coverPhotoUrl || null,
                locationName: data.locationName || null,
                scope: data.scope,
                eventType: data.eventType,
                startsAt: new Date(data.startsAt),
                endsAt: new Date(data.endsAt),
                mandateId: data.mandateId || null,
                showOnTimeline: data.showOnTimeline ?? true,
            },
        });
        revalidatePath("/timeline");
        revalidatePath("/admin/mandates");
        return {success: true, data: {id: event.id}};
    } catch (e) {
        return actionError(e);
    }
}

export async function updateEvent(
    id: string,
    data: Partial<EventFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
        if (data.title !== undefined) requireText(data.title, "Title", 200);
        if (data.scope !== undefined) requireEnum(data.scope, EventScope, "Scope");
        if (data.eventType !== undefined) requireEnum(data.eventType, EventType, "Event type");
        optionalDate(data.startsAt, "Start date");
        optionalDate(data.endsAt, "End date");
        optionalUrl(data.coverPhotoUrl, "Cover photo URL");
        await prisma.event.update({
            where: {id},
            data: {
                ...(data.title && {title: data.title}),
                ...(data.description !== undefined && {
                    description: data.description || null,
                }),
                ...(data.coverPhotoUrl !== undefined && {
                    coverPhotoUrl: data.coverPhotoUrl || null,
                }),
                ...(data.locationName !== undefined && {
                    locationName: data.locationName || null,
                }),
                ...(data.scope && {scope: data.scope}),
                ...(data.eventType && {eventType: data.eventType}),
                ...(data.startsAt && {startsAt: new Date(data.startsAt)}),
                ...(data.endsAt && {endsAt: new Date(data.endsAt)}),
                ...(data.mandateId !== undefined && {
                    mandateId: data.mandateId || null,
                }),
                ...(data.showOnTimeline !== undefined && {
                    showOnTimeline: data.showOnTimeline,
                }),
            },
        });
        revalidatePath("/timeline");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

/**
 * Creates a new event and immediately attaches a member to it.
 * Used from the member edit page so a participation (and, optionally,
 * a member-only event hidden from the public timeline) can be added in one step.
 */
export async function createEventForMember(
    memberId: string,
    role: string,
    data: EventFormData
): Promise<ActionResult<{ eventId: string }>> {
    try {
        await requireAuth();
        requireEventData(data);
        const event = await prisma.event.create({
            data: {
                title: data.title,
                description: data.description || null,
                coverPhotoUrl: data.coverPhotoUrl || null,
                locationName: data.locationName || null,
                scope: data.scope,
                eventType: data.eventType,
                startsAt: new Date(data.startsAt),
                endsAt: new Date(data.endsAt),
                mandateId: data.mandateId || null,
                showOnTimeline: data.showOnTimeline ?? true,
                participations: {
                    create: {memberId, role: role || "Participant"},
                },
            },
        });
        const member = await prisma.member.findUnique({
            where: {id: memberId},
            select: {slug: true},
        });
        if (member) revalidatePath(`/members/${member.slug}`);
        if (data.showOnTimeline ?? true) revalidatePath("/timeline");
        return {success: true, data: {eventId: event.id}};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction([
            prisma.eventParticipation.deleteMany({where: {eventId: id}}),
            prisma.event.delete({where: {id}}),
        ]);
        revalidatePath("/timeline");
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteEvents(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction([
            prisma.eventParticipation.deleteMany({where: {eventId: {in: ids}}}),
            prisma.event.deleteMany({where: {id: {in: ids}}}),
        ]);
        revalidatePath("/timeline");
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function addParticipant(
    eventId: string,
    memberId: string,
    role: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.eventParticipation.create({
            data: {eventId, memberId, role},
        });
        const member = await prisma.member.findUnique({
            where: {id: memberId},
            select: {slug: true},
        });
        revalidatePath(`/members/${member?.slug}`);
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function removeParticipant(
    participationId: string,
    memberId: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.eventParticipation.delete({where: {id: participationId}});
        const member = await prisma.member.findUnique({
            where: {id: memberId},
            select: {slug: true},
        });
        if (member) revalidatePath(`/members/${member.slug}`);
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}
