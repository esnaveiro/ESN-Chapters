-- CreateTable
CREATE TABLE "milestone_member" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "milestoneId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "milestone_member_milestoneId_idx" ON "milestone_member"("milestoneId");

-- CreateIndex
CREATE INDEX "milestone_member_memberId_idx" ON "milestone_member"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_member_milestoneId_memberId_key" ON "milestone_member"("milestoneId", "memberId");

-- AddForeignKey
ALTER TABLE "milestone_member" ADD CONSTRAINT "milestone_member_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_member" ADD CONSTRAINT "milestone_member_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
