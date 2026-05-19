"use server";

import {prisma} from "@/lib/prisma";
import {createClient} from "@/lib/supabase/server";
import {EventScope, EventType} from "@/generated/prisma/enums";
import {revalidatePath} from "next/cache";
import {ActionResult} from "@/types";

async function requireAuth() {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return user;
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
};

export async function createEvent(
    data: EventFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
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
            },
        });
        revalidatePath("/timeline");
        revalidatePath("/admin/mandates");
        return {success: true, data: {id: event.id}};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function updateEvent(
    id: string,
    data: Partial<EventFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
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
            },
        });
        revalidatePath("/timeline");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
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
        return {success: false, error: String(e)};
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
        return {success: false, error: String(e)};
    }
}
