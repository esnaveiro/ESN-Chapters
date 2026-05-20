"use server";

import {prisma} from "@/lib/prisma";
import {createClient} from "@/lib/supabase/server";
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

export type MandateFormData = {
    name: string;
    academicYear: string;
    startsAt: string;
    endsAt?: string;
    photoUrl?: string;
    colorIndex?: number;
    customColor?: string;
};

export async function createMandate(
    data: MandateFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        const mandate = await prisma.mandate.create({
            data: {
                name: data.name,
                academicYear: data.academicYear,
                startsAt: new Date(data.startsAt),
                endsAt: data.endsAt ? new Date(data.endsAt) : null,
                photoUrl: data.photoUrl || null,
                colorIndex: data.colorIndex ?? 0,
                customColor: data.customColor || null,
            },
        });
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/");
        return {success: true, data: {id: mandate.id}};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function updateMandate(
    id: string,
    data: Partial<MandateFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
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
                ...(data.colorIndex !== undefined && {colorIndex: data.colorIndex}),
                ...(data.customColor !== undefined && {customColor: data.customColor || null}),
            },
        });
        revalidatePath("/mandates");
        revalidatePath(`/mandates/${id}`);
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteMandate(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.mandate.delete({where: {id}});
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteMandates(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.mandate.deleteMany({where: {id: {in: ids}}});
        revalidatePath("/mandates");
        revalidatePath("/admin/mandates");
        revalidatePath("/");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function addMemberToMandate(
    mandateId: string,
    memberId: string,
    department: string,
    roleTitle: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.mandateMembership.create({
            data: {mandateId, memberId, department, roleTitle},
        });
        revalidatePath(`/mandates/${mandateId}`);
        revalidatePath("/admin/mandates");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
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
        return {success: false, error: String(e)};
    }
}
