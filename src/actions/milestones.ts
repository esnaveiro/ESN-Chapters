"use server";

import {prisma} from "@/lib/prisma";
import {createClient} from "@/lib/supabase/server";
import {MilestoneType} from "@/generated/prisma/enums";
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
        return {success: true, data: {id: milestone.id}};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function updateMilestone(
    id: string,
    data: Partial<MilestoneFormData>
): Promise<ActionResult> {
    try {
        await requireAuth();
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
        return {success: false, error: String(e)};
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
        return {success: false, error: String(e)};
    }
}
