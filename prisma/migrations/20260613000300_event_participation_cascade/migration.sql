-- DropForeignKey
ALTER TABLE "event_participation" DROP CONSTRAINT "event_participation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_participation" DROP CONSTRAINT "event_participation_memberId_fkey";

-- AddForeignKey
ALTER TABLE "event_participation" ADD CONSTRAINT "event_participation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participation" ADD CONSTRAINT "event_participation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
