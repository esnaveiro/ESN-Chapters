-- DropForeignKey
ALTER TABLE "member_badge" DROP CONSTRAINT "member_badge_memberId_fkey";

-- DropForeignKey
ALTER TABLE "member_badge" DROP CONSTRAINT "member_badge_badgeId_fkey";

-- AddForeignKey
ALTER TABLE "member_badge" ADD CONSTRAINT "member_badge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_badge" ADD CONSTRAINT "member_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
