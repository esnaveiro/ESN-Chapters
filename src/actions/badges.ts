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

export async function createBadge(
    name: string,
    description: string,
    icon: string
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        const badge = await prisma.badge.create({
            data: {name, description: description || null, icon: icon || null},
        });
        revalidatePath("/admin/badges");
        return {success: true, data: {id: badge.id}};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function awardBadge(
    memberId: string,
    badgeId: string,
    awardedAt: string
): Promise<ActionResult> {
    try {
        const user = await requireAuth();
        await prisma.memberBadge.create({
            data: {
                memberId,
                badgeId,
                awardedAt: new Date(awardedAt),
                awardedBy: user.id,
            },
        });
        const member = await prisma.member.findUnique({
            where: {id: memberId},
            select: {slug: true},
        });
        revalidatePath(`/members/${member?.slug}`);
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function updateBadge(
    id: string,
    name: string,
    description: string,
    icon: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.badge.update({
            where: {id},
            data: {name, description: description || null, icon: icon || null},
        });
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteBadge(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.badge.delete({where: {id}});
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteBadges(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.badge.deleteMany({where: {id: {in: ids}}});
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function revokeBadge(memberBadgeId: string, memberSlug: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.memberBadge.delete({where: {id: memberBadgeId}});
        revalidatePath(`/members/${memberSlug}`);
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}
