"use server";

import {prisma} from "@/lib/prisma";
import {actionError, requireAuth} from "@/lib/auth";
import {optionalDate, optionalText, requireDate, requireEnum, requireText} from "@/lib/validation";
import {MilestoneType} from "@/generated/prisma/enums";
import {revalidatePath} from "next/cache";
import {ActionResult} from "@/types";

export type MilestoneFormData = {
    title: string;
    description?: string;
    happenedAt: string;
    type: MilestoneType;
    mandateId?: string;
};

export async function createMilestone(
    data: MilestoneFormData
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        requireText(data.title, "Title", 200);
        requireEnum(data.type, MilestoneType, "Type");
        requireDate(data.happenedAt, "Date");
        optionalText(data.description, "Description");
        const milestone = await prisma.milestone.create({
            data: {
                title: data.title,
                description: data.description || null,
                happenedAt: new Date(data.happenedAt),
                type: data.type,
                mandateId: data.mandateId || null,
            },
        });
        revalidatePath("/timeline");
        revalidatePath("/admin/milestones");
        if (data.mandateId) revalidatePath(`/admin/mandates/${data.mandateId}/edit`);
        return {success: true, data: {id: milestone.id}};
    } catch (e) {
        return actionError(e);
    }
}

export async function updateMilestone(
    id: string,
    data: Partial<MilestoneFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
        if (data.title !== undefined) requireText(data.title, "Title", 200);
        if (data.type !== undefined) requireEnum(data.type, MilestoneType, "Type");
        optionalDate(data.happenedAt, "Date");
        await prisma.milestone.update({
            where: {id},
            data: {
                ...(data.title && {title: data.title}),
                ...(data.description !== undefined && {
                    description: data.description || null,
                }),
                ...(data.happenedAt && {happenedAt: new Date(data.happenedAt)}),
                ...(data.type && {type: data.type}),
                ...(data.mandateId !== undefined && {
                    mandateId: data.mandateId || null,
                }),
            },
        });
        revalidatePath("/timeline");
        revalidatePath("/admin/milestones");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.milestone.delete({where: {id}});
        revalidatePath("/timeline");
        revalidatePath("/admin/milestones");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function addMilestoneMember(
    milestoneId: string,
    memberId: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.milestoneMember.create({data: {milestoneId, memberId}});
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

export async function removeMilestoneMember(
    id: string,
    memberId: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.milestoneMember.delete({where: {id}});
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

export async function deleteMilestones(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.milestone.deleteMany({where: {id: {in: ids}}});
        revalidatePath("/timeline");
        revalidatePath("/admin/milestones");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}
