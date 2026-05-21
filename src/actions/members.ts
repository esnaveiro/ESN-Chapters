"use server";

import {prisma} from "@/lib/prisma";
import {createClient} from "@/lib/supabase/server";
import {MemberStatus} from "@/generated/prisma/enums";
import {revalidatePath} from "next/cache";
import {slugify} from "@/lib/utils";
import {ActionResult} from "@/types";

async function requireAuth() {
    const supabase = await createClient();
    const {
        data: {user},
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    return user;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 2;
    while (true) {
        const existing = await prisma.member.findUnique({
            where: {slug},
            select: {id: true},
        });
        if (!existing || existing.id === excludeId) break;
        slug = `${base}-${counter++}`;
    }
    return slug;
}

export type StatusEntry = {
    status: MemberStatus;
    startedAt: string;
};

export type MemberFormData = {
    fullName: string;
    bio?: string;
    favouriteMemory?: string;
    linkedinUrl?: string;
    joinedAt: string;
    photoUrl?: string;
    statusHistory: StatusEntry[];
    buddyId?: string;
    newbieIds?: string[];
};

export async function createMember(
    data: MemberFormData
): Promise<ActionResult<{ id: string; slug: string }>> {
    try {
        await requireAuth();
        const slug = await uniqueSlug(data.fullName);

        const sorted = [...data.statusHistory].sort(
            (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );

        const member = await prisma.member.create({
            data: {
                slug,
                fullName: data.fullName,
                bio: data.bio || null,
                favouriteMemory: data.favouriteMemory || null,
                linkedinUrl: data.linkedinUrl || null,
                joinedAt: new Date(data.joinedAt),
                photoUrl: data.photoUrl || null,
                isAlumni: sorted.at(-1)?.status === "ALUMNI",
                statusHistory: {
                    create: sorted.map((entry, i) => ({
                        status: entry.status,
                        startedAt: new Date(entry.startedAt),
                        endedAt: sorted[i + 1] ? new Date(sorted[i + 1].startedAt) : null,
                    })),
                },
            },
        });
        if (data.buddyId) {
            await prisma.buddyLink.create({data: {buddyId: data.buddyId, newbieId: member.id}});
        }
        if (data.newbieIds?.length) {
            await prisma.buddyLink.createMany({
                data: data.newbieIds.map((newbieId) => ({buddyId: member.id, newbieId})),
                skipDuplicates: true,
            });
        }

        revalidatePath("/members");
        revalidatePath("/admin/members");
        if (data.buddyId || data.newbieIds?.length) revalidatePath("/network");
        return {success: true, data: {id: member.id, slug: member.slug}};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export type MemberUpdateData = {
    fullName?: string;
    bio?: string;
    favouriteMemory?: string;
    linkedinUrl?: string;
    joinedAt?: string;
    photoUrl?: string;
};

export async function updateMember(
    id: string,
    data: MemberUpdateData
): Promise<ActionResult> {
    try {
        await requireAuth();
        const member = await prisma.member.findUnique({where: {id}});
        if (!member) return {success: false, error: "Member not found"};

        const slug =
            data.fullName && data.fullName !== member.fullName
                ? await uniqueSlug(data.fullName, id)
                : undefined;

        await prisma.member.update({
            where: {id},
            data: {
                ...(data.fullName && {fullName: data.fullName}),
                ...(slug && {slug}),
                bio: data.bio ?? member.bio,
                favouriteMemory: data.favouriteMemory ?? member.favouriteMemory,
                linkedinUrl: data.linkedinUrl ?? member.linkedinUrl,
                ...(data.joinedAt && {joinedAt: new Date(data.joinedAt)}),
                ...(data.photoUrl !== undefined && {photoUrl: data.photoUrl}),
            },
        });

        revalidatePath(`/members/${member.slug}`);
        revalidatePath("/admin/members");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function promoteMember(
    id: string,
    newStatus: MemberStatus
): Promise<ActionResult> {
    try {
        await requireAuth();
        const now = new Date();

        await prisma.$transaction([
            prisma.statusHistory.updateMany({
                where: {memberId: id, endedAt: null},
                data: {endedAt: now},
            }),
            prisma.statusHistory.create({
                data: {memberId: id, status: newStatus, startedAt: now},
            }),
            ...(newStatus === "ALUMNI"
                ? [
                    prisma.member.update({
                        where: {id},
                        data: {isAlumni: true, leftAt: now},
                    }),
                ]
                : []),
        ]);

        const member = await prisma.member.findUnique({
            where: {id},
            select: {slug: true},
        });
        revalidatePath(`/members/${member?.slug}`);
        revalidatePath("/admin/members");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function setStatusHistory(
    memberId: string,
    entries: { status: MemberStatus; startedAt: string }[]
): Promise<ActionResult> {
    try {
        await requireAuth();
        const sorted = [...entries].sort(
            (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );
        await prisma.$transaction([
            prisma.statusHistory.deleteMany({where: {memberId}}),
            prisma.statusHistory.createMany({
                data: sorted.map((entry, i) => ({
                    memberId,
                    status: entry.status,
                    startedAt: new Date(entry.startedAt),
                    endedAt: sorted[i + 1] ? new Date(sorted[i + 1].startedAt) : null,
                })),
            }),
            ...(sorted.at(-1)?.status === "ALUMNI"
                ? [prisma.member.update({where: {id: memberId}, data: {isAlumni: true}})]
                : [prisma.member.update({where: {id: memberId}, data: {isAlumni: false}})]),
        ]);
        const member = await prisma.member.findUnique({where: {id: memberId}, select: {slug: true}});
        revalidatePath(`/members/${member?.slug}`);
        revalidatePath("/admin/members");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function removeBuddyLink(newbieId: string): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.buddyLink.deleteMany({where: {newbieId}});
        revalidatePath("/network");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function setBuddyLink(
    buddyId: string,
    newbieId: string
): Promise<ActionResult> {
    try {
        await requireAuth();
        if (buddyId === newbieId)
            return {success: false, error: "A member cannot be their own buddy"};

        const existing = await prisma.buddyLink.findFirst({
            where: {newbieId},
        });
        if (existing)
            return {success: false, error: "This member already has a buddy"};

        await prisma.buddyLink.create({data: {buddyId, newbieId}});
        revalidatePath("/network");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

async function deleteMemberById(id: string) {
    await prisma.$transaction([
        prisma.statusHistory.deleteMany({where: {memberId: id}}),
        prisma.mandateMembership.deleteMany({where: {memberId: id}}),
        prisma.buddyLink.deleteMany({where: {OR: [{buddyId: id}, {newbieId: id}]}}),
        prisma.tribute.deleteMany({where: {OR: [{recipientId: id}, {authorId: id}]}}),
        prisma.memberBadge.deleteMany({where: {memberId: id}}),
        prisma.eventParticipation.deleteMany({where: {memberId: id}}),
        prisma.member.delete({where: {id}}),
    ]);
}

export async function deleteMember(id: string): Promise<ActionResult> {
    try {
        await requireAuth();
        const member = await prisma.member.findUnique({where: {id}, select: {slug: true}});
        await deleteMemberById(id);
        revalidatePath("/members");
        revalidatePath(`/members/${member?.slug}`);
        revalidatePath("/admin/members");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteMembers(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        for (const id of ids) {
            await deleteMemberById(id);
        }
        revalidatePath("/members");
        revalidatePath("/admin/members");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function addTribute(
    authorId: string,
    recipientId: string,
    message: string,
    date?: string,
): Promise<ActionResult> {
    try {
        await requireAuth();
        if (message.length > 500)
            return {success: false, error: "Message too long (max 500 characters)"};

        await prisma.tribute.create({
            data: {
                authorId,
                recipientId,
                message,
                ...(date ? {createdAt: new Date(date)} : {}),
            },
        });

        const recipient = await prisma.member.findUnique({
            where: {id: recipientId},
            select: {slug: true},
        });
        revalidatePath(`/members/${recipient?.slug}`);
        revalidatePath(`/admin/members/${recipientId}/edit`);
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteTributes(ids: string[]): Promise<ActionResult> {
    try {
        await requireAuth();
        await prisma.tribute.deleteMany({where: {id: {in: ids}}});
        revalidatePath("/admin/tributes");
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}

export async function deleteTribute(tributeId: string, recipientId: string): Promise<ActionResult> {
    try {
        await requireAuth();
        const tribute = await prisma.tribute.findUnique({
            where: {id: tributeId},
            include: {recipient: {select: {slug: true}}},
        });
        await prisma.tribute.delete({where: {id: tributeId}});
        revalidatePath(`/members/${tribute?.recipient.slug}`);
        revalidatePath(`/admin/members/${recipientId}/edit`);
        return {success: true, data: undefined};
    } catch (e) {
        return {success: false, error: String(e)};
    }
}
