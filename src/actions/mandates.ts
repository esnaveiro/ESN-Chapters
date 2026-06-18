"use server";

import {prisma} from "@/lib/prisma";
import {actionError, requireAuth} from "@/lib/auth";
import {optionalDate, optionalUrl, requireDate, requireText} from "@/lib/validation";
import {revalidatePath} from "next/cache";
import {ActionResult} from "@/types";

export type MandateFormData = {
    name: string;
    academicYear: string;
    startsAt: string;
    endsAt?: string;
    photoUrl?: string;
    photoFocusX?: number;
    photoFocusY?: number;
    colorIndex?: number;
    customColor?: string;
};

export async function createMandate(
    data: MandateFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        requireText(data.name, "Name", 200);
        requireText(data.academicYear, "Academic year", 20);
        requireDate(data.startsAt, "Start date");
        optionalDate(data.endsAt, "End date");
        optionalUrl(data.photoUrl, "Photo URL");
        const mandate = await prisma.mandate.create({
            data: {
                name: data.name,
                academicYear: data.academicYear,
                startsAt: new Date(data.startsAt),
                endsAt: data.endsAt ? new Date(data.endsAt) : null,
                photoUrl: data.photoUrl || null,
                photoFocusX: data.photoFocusX ?? 50,
                photoFocusY: data.photoFocusY ?? 50,
                colorIndex: data.colorIndex ?? 0,
                customColor: data.customColor || null,
            },
        });
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/");
        return {success: true, data: {id: mandate.id}};
    } catch (e) {
        return actionError(e);
    }
}

export async function updateMandate(
    id: string,
    data: Partial<MandateFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
        if (data.name !== undefined) requireText(data.name, "Name", 200);
        if (data.academicYear !== undefined) requireText(data.academicYear, "Academic year", 20);
        optionalDate(data.startsAt, "Start date");
        optionalDate(data.endsAt, "End date");
        optionalUrl(data.photoUrl, "Photo URL");
        await prisma.mandate.update({
            where: {id},
            data: {
                ...(data.name && {name: data.name}),
                ...(data.academicYear && {academicYear: data.academicYear}),
                ...(data.startsAt && {startsAt: new Date(data.startsAt)}),
                ...(data.endsAt !== undefined && {
                    endsAt: data.endsAt ? new Date(data.endsAt) : null,
                }),
                ...(data.photoUrl !== undefined && {photoUrl: data.photoUrl}),
                ...(data.photoFocusX !== undefined && {photoFocusX: data.photoFocusX}),
                ...(data.photoFocusY !== undefined && {photoFocusY: data.photoFocusY}),
                ...(data.colorIndex !== undefined && {colorIndex: data.colorIndex}),
                ...(data.customColor !== undefined && {customColor: data.customColor || null}),
            },
        });
        revalidatePath("/mandates");
        revalidatePath(`/mandates/${id}`);
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteMandate(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        // Remove memberships and detach (don't delete) events/milestones first — their FKs restrict.
        await prisma.$transaction([
            prisma.mandateMembership.deleteMany({where: {mandateId: id}}),
            prisma.event.updateMany({where: {mandateId: id}, data: {mandateId: null}}),
            prisma.milestone.updateMany({where: {mandateId: id}, data: {mandateId: null}}),
            prisma.mandate.delete({where: {id}}),
        ]);
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/timeline");
        revalidatePath("/");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteMandates(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction([
            prisma.mandateMembership.deleteMany({where: {mandateId: {in: ids}}}),
            prisma.event.updateMany({where: {mandateId: {in: ids}}, data: {mandateId: null}}),
            prisma.milestone.updateMany({where: {mandateId: {in: ids}}, data: {mandateId: null}}),
            prisma.mandate.deleteMany({where: {id: {in: ids}}}),
        ]);
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/timeline");
        revalidatePath("/");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export type RoleEntry = { department: string; roleTitle: string };

export async function addMemberToMandate(
    mandateId: string,
    memberId: string,
    roles: RoleEntry[]
): Promise<ActionResult> {
    try {
        await requireAuth();
        const max = await prisma.mandateMembership.aggregate({
            where: {mandateId},
            _max: {sortOrder: true},
        });
        const sortOrder = (max._max.sortOrder ?? -1) + 1;
        await prisma.mandateMembership.create({
            data: {
                mandateId,
                memberId,
                departments: roles.map(r => r.department).filter(Boolean),
                roleTitles: roles.map(r => r.roleTitle).filter(Boolean),
                sortOrder,
            },
        });
        revalidatePath(`/mandates/${mandateId}`);
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function removeMemberFromMandate(
    membershipId: string,
    mandateId: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.mandateMembership.delete({where: {id: membershipId}});
        revalidatePath(`/mandates/${mandateId}`);
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function updateMandateMembership(
    membershipId: string,
    roles: RoleEntry[]
): Promise<ActionResult> {
    try {
        await requireAuth();
        const ms = await prisma.mandateMembership.findUnique({
            where: {id: membershipId},
            select: {mandateId: true, member: {select: {slug: true}}},
        });
        if (!ms) return {success: false, error: "Membership not found"};
        await prisma.mandateMembership.update({
            where: {id: membershipId},
            data: {
                departments: roles.map(r => r.department).filter(Boolean),
                roleTitles: roles.map(r => r.roleTitle).filter(Boolean),
            },
        });
        revalidatePath(`/mandates/${ms.mandateId}`);
        revalidatePath(`/members/${ms.member.slug}`);
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function reorderMandateMemberships(
    mandateId: string,
    orderedIds: string[],
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction(
            orderedIds.map((id, i) =>
                prisma.mandateMembership.update({where: {id}, data: {sortOrder: i}})
            )
        );
        revalidatePath(`/mandates/${mandateId}`);
        revalidatePath(`/admin/mandates/${mandateId}/edit`);
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}
