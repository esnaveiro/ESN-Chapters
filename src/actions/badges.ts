"use server";

import {prisma} from "@/lib/prisma";
import {actionError, requireAuth} from "@/lib/auth";
import {optionalText, requireDate, requireText} from "@/lib/validation";
import {revalidatePath} from "next/cache";
import {ActionResult} from "@/types";

export async function createBadge(
    name: string,
    description: string,
    icon: string
): Promise<ActionResult<{ id: string }>> {
    try {
        await requireAuth();
        requireText(name, "Name", 100);
        optionalText(description, "Description", 500);
        optionalText(icon, "Icon", 100);
        const badge = await prisma.badge.create({
            data: {name, description: description || null, icon: icon || null},
        });
        revalidatePath("/admin/badges");
        return {success: true, data: {id: badge.id}};
    } catch (e) {
        return actionError(e);
    }
}

export async function awardBadge(
    memberId: string,
    badgeId: string,
    awardedAt: string
): Promise<ActionResult> {
    try {
        const user = await requireAuth();
        requireDate(awardedAt, "Award date");
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
        return actionError(e);
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
        requireText(name, "Name", 100);
        optionalText(description, "Description", 500);
        optionalText(icon, "Icon", 100);
        await prisma.badge.update({
            where: {id},
            data: {name, description: description || null, icon: icon || null},
        });
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteBadge(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction([
            prisma.memberBadge.deleteMany({where: {badgeId: id}}),
            prisma.badge.delete({where: {id}}),
        ]);
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
    }
}

export async function deleteBadges(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.$transaction([
            prisma.memberBadge.deleteMany({where: {badgeId: {in: ids}}}),
            prisma.badge.deleteMany({where: {id: {in: ids}}}),
        ]);
        revalidatePath("/admin/badges");
        return {success: true, data: undefined};
    } catch (e) {
        return actionError(e);
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
        return actionError(e);
    }
}
