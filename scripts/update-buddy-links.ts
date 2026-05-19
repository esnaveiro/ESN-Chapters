/**
 * Update buddy links in the database.
 *
 * Edit BUDDY_LINKS below and run:
 *   tsx scripts/update-buddy-links.ts
 *
 * The script:
 *   1. Resolves member slugs → IDs
 *   2. Deletes all existing buddy_link rows
 *   3. Inserts the new links
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter } as never);

// ─── Edit this table ─────────────────────────────────────────────────────────
// Use the slug values from the member table (visible in the URL /members/<slug>).
// linkedAt is optional; remove it or set to null if unknown.

const BUDDY_LINKS: Array<{ buddy: string; newbie: string; linkedAt?: string }> = [
  // 2019/20 alumni → 2021/22 cohort
  { buddy: "ana-ferreira",    newbie: "elena-rodrigues",  linkedAt: "2021-09-15" },
  { buddy: "bruno-martins",   newbie: "francisco-costa",  linkedAt: "2021-09-15" },
  { buddy: "catarina-sousa",  newbie: "gabriela-lima",    linkedAt: "2022-02-10" },

  // 2019/20 & 2020/21 alumni → 2022/23 cohort (cross-generational)
  { buddy: "ana-ferreira",    newbie: "henrique-santos",  linkedAt: "2022-09-15" },
  { buddy: "diogo-almeida",   newbie: "ins-carvalho",     linkedAt: "2022-09-15" },
  { buddy: "catarina-sousa",  newbie: "joo-pereira",      linkedAt: "2023-02-10" },

  // 2021/22 seniors → 2023/24 cohort (former newbies now mentoring)
  { buddy: "elena-rodrigues", newbie: "kira-novak",       linkedAt: "2023-09-15" },
  { buddy: "elena-rodrigues", newbie: "lucas-oliveira",   linkedAt: "2023-09-15" },
  { buddy: "francisco-costa", newbie: "mariana-gomes",    linkedAt: "2024-02-10" },

  // 2022/23 juniors → 2024/25 cohort
  { buddy: "gabriela-lima",   newbie: "nuno-figueiredo",  linkedAt: "2024-09-15" },
  { buddy: "henrique-santos", newbie: "olga-petrenko",    linkedAt: "2024-09-15" },
  { buddy: "ins-carvalho",    newbie: "pedro-azevedo",    linkedAt: "2024-09-15" },
];
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const allSlugs = [...new Set(BUDDY_LINKS.flatMap(r => [r.buddy, r.newbie]))];

  const members = await prisma.member.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true, fullName: true },
  });

  const bySlug = new Map(members.map(m => [m.slug, m]));

  // Validate — fail early if any slug is missing
  const missing = allSlugs.filter(s => !bySlug.has(s));
  if (missing.length > 0) {
    console.error(`\nUnknown slugs — fix BUDDY_LINKS and retry:\n${missing.map(s => `  • ${s}`).join("\n")}`);
    process.exit(1);
  }

  // Delete all existing links
  const { count: deleted } = await prisma.buddyLink.deleteMany({});
  console.log(`Deleted ${deleted} existing buddy link${deleted !== 1 ? "s" : ""}.`);

  // Insert new links
  let created = 0;
  for (const row of BUDDY_LINKS) {
    const buddy  = bySlug.get(row.buddy)!;
    const newbie = bySlug.get(row.newbie)!;

    await prisma.buddyLink.create({
      data: {
        buddyId:  buddy.id,
        newbieId: newbie.id,
        linkedAt: row.linkedAt ? new Date(row.linkedAt) : null,
      },
    });

    console.log(`  ${buddy.fullName.padEnd(20)} → ${newbie.fullName}`);
    created++;
  }

  console.log(`\nDone. Created ${created} buddy link${created !== 1 ? "s" : ""}.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
