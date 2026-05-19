-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('NEWBIE', 'CANDIDATE_MEMBER', 'JUNIOR', 'SENIOR', 'ALUMNI');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('EVENT', 'FIRST', 'AWARD', 'OTHER');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('LOCAL', 'NATIONAL', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CULTURAL', 'PROJECTS', 'ACTIVITIES', 'OTHER');

-- CreateTable
CREATE TABLE "member"
(
    "id"              UUID    NOT NULL DEFAULT gen_random_uuid(),
    "slug"            TEXT    NOT NULL,
    "fullName"        TEXT    NOT NULL,
    "photoUrl"        TEXT,
    "bio"             TEXT,
    "favouriteMemory" TEXT,
    "linkedinUrl"     TEXT,
    "joinedAt"        DATE    NOT NULL,
    "leftAt"          DATE,
    "isAlumni"        BOOLEAN NOT NULL DEFAULT false,
    "createdAt"       TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history"
(
    "id"        UUID           NOT NULL DEFAULT gen_random_uuid(),
    "memberId"  UUID           NOT NULL,
    "status"    "MemberStatus" NOT NULL,
    "startedAt" DATE           NOT NULL,
    "endedAt"   DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandate"
(
    "id"           UUID    NOT NULL DEFAULT gen_random_uuid(),
    "name"         TEXT    NOT NULL,
    "academicYear" TEXT    NOT NULL,
    "startsAt"     DATE    NOT NULL,
    "endsAt"       DATE,
    "photoUrl"     TEXT,
    "colorIndex"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"    TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mandate_membership"
(
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "memberId"   UUID NOT NULL,
    "mandateId"  UUID NOT NULL,
    "department" TEXT NOT NULL,
    "roleTitle"  TEXT NOT NULL,
    "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mandate_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buddy_link"
(
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "buddyId"   UUID NOT NULL,
    "newbieId"  UUID NOT NULL,
    "linkedAt"  DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buddy_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tribute"
(
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "authorId"    UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "message"     TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone"
(
    "id"          UUID            NOT NULL DEFAULT gen_random_uuid(),
    "title"       TEXT            NOT NULL,
    "description" TEXT,
    "happenedAt"  DATE            NOT NULL,
    "type"        "MilestoneType" NOT NULL,
    "mandateId"   UUID,
    "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge"
(
    "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "icon"        TEXT,
    "createdAt"   TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_badge"
(
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "memberId"  UUID NOT NULL,
    "badgeId"   UUID NOT NULL,
    "awardedAt" DATE NOT NULL,
    "awardedBy" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event"
(
    "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
    "title"         TEXT         NOT NULL,
    "description"   TEXT,
    "coverPhotoUrl" TEXT,
    "locationName"  TEXT,
    "scope"         "EventScope" NOT NULL,
    "eventType"     "EventType"  NOT NULL,
    "startsAt"      DATE         NOT NULL,
    "endsAt"        DATE         NOT NULL,
    "mandateId"     UUID,
    "createdAt"     TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participation"
(
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId"   UUID NOT NULL,
    "memberId"  UUID NOT NULL,
    "role"      TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_slug_key" ON "member" ("slug");

-- CreateIndex
CREATE INDEX "status_history_memberId_idx" ON "status_history" ("memberId");

-- CreateIndex
CREATE INDEX "mandate_membership_memberId_idx" ON "mandate_membership" ("memberId");

-- CreateIndex
CREATE INDEX "mandate_membership_mandateId_idx" ON "mandate_membership" ("mandateId");

-- CreateIndex
CREATE INDEX "buddy_link_buddyId_idx" ON "buddy_link" ("buddyId");

-- CreateIndex
CREATE INDEX "buddy_link_newbieId_idx" ON "buddy_link" ("newbieId");

-- CreateIndex
CREATE INDEX "tribute_recipientId_idx" ON "tribute" ("recipientId");

-- CreateIndex
CREATE INDEX "member_badge_memberId_idx" ON "member_badge" ("memberId");

-- CreateIndex
CREATE INDEX "event_mandateId_idx" ON "event" ("mandateId");

-- CreateIndex
CREATE INDEX "event_scope_idx" ON "event" ("scope");

-- CreateIndex
CREATE INDEX "event_eventType_idx" ON "event" ("eventType");

-- CreateIndex
CREATE INDEX "event_participation_eventId_idx" ON "event_participation" ("eventId");

-- CreateIndex
CREATE INDEX "event_participation_memberId_idx" ON "event_participation" ("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participation_eventId_memberId_key" ON "event_participation" ("eventId", "memberId");

-- AddForeignKey
ALTER TABLE "status_history"
    ADD CONSTRAINT "status_history_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandate_membership"
    ADD CONSTRAINT "mandate_membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandate_membership"
    ADD CONSTRAINT "mandate_membership_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_link"
    ADD CONSTRAINT "buddy_link_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buddy_link"
    ADD CONSTRAINT "buddy_link_newbieId_fkey" FOREIGN KEY ("newbieId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribute"
    ADD CONSTRAINT "tribute_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribute"
    ADD CONSTRAINT "tribute_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone"
    ADD CONSTRAINT "milestone_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandate" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badge"
    ADD CONSTRAINT "member_badge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badge"
    ADD CONSTRAINT "member_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event"
    ADD CONSTRAINT "event_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "mandate" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participation"
    ADD CONSTRAINT "event_participation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participation"
    ADD CONSTRAINT "event_participation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
