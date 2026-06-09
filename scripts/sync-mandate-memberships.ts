/**
 * Backfill mandate memberships for all existing members.
 * A member is added to a mandate if they were active (status ≠ ALUMNI) during
 * its period: joinedAt ≤ mandate_end AND (leftAt IS NULL OR leftAt ≥ mandate_start).
 * Existing memberships (with roles/departments filled) are never touched.
 *
 * Run with: npx tsx scripts/sync-mandate-memberships.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  max: 1,
});
const prisma = new PrismaClient({ adapter } as never);

function mandateEndDate(mandate: { endsAt: Date | null; academicYear: string }): Date {
  if (mandate.endsAt) return mandate.endsAt;
  const endYear = Number("20" + mandate.academicYear.split("/")[1]);
  return new Date(`${endYear}-08-31`);
}

async function main() {
  const [members, mandates, existingMemberships] = await Promise.all([
    prisma.member.findMany({ select: { id: true, fullName: true, joinedAt: true, leftAt: true } }),
    prisma.mandate.findMany({ select: { id: true, academicYear: true, startsAt: true, endsAt: true } }),
    prisma.mandateMembership.findMany({ select: { memberId: true, mandateId: true } }),
  ]);

  const alreadyIn = new Set(existingMemberships.map((e) => `${e.memberId}:${e.mandateId}`));

  console.log(`Members: ${members.length}  Mandates: ${mandates.length}  Existing memberships: ${existingMemberships.length}\n`);

  const toCreate: { memberId: string; mandateId: string; departments: string[]; roleTitles: string[] }[] = [];

  for (const member of members) {
    const added: string[] = [];
    for (const mandate of mandates) {
      if (alreadyIn.has(`${member.id}:${mandate.id}`)) continue;
      const mEnd = mandateEndDate(mandate);
      const afterJoin  = member.joinedAt <= mEnd;
      const beforeLeft = !member.leftAt || member.leftAt >= mandate.startsAt;
      if (afterJoin && beforeLeft) {
        toCreate.push({ memberId: member.id, mandateId: mandate.id, departments: [], roleTitles: [] });
        added.push(mandate.academicYear);
      }
    }
    if (added.length) console.log(`  ${member.fullName}: → ${added.join(", ")}`);
  }

  if (toCreate.length === 0) {
    console.log("Nothing to add — all memberships are already up to date.");
    return;
  }

  await prisma.mandateMembership.createMany({ data: toCreate, skipDuplicates: true });
  console.log(`\nDone — ${toCreate.length} memberships created.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
