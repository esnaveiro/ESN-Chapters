/**
 * Migrate badge icons from emoji strings to lucide icon names.
 *
 * Run with:
 *   tsx scripts/migrate-badge-icons.ts
 */

import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: {rejectUnauthorized: false},
});
const prisma = new PrismaClient({adapter} as never);

const EMOJI_TO_ICON: Record<string, string> = {
    "🌟": "star",
    "⭐": "star",
    "💯": "trophy",
    "🏆": "trophy",
    "🥇": "medal",
    "🏅": "medal",
    "🤝": "handshake",
    "🏛️": "landmark",
    "🏛": "landmark",
    "✈️": "plane",
    "✈": "plane",
    "🌍": "globe",
    "🌎": "globe",
    "🌐": "globe",
    "❤️": "heart",
    "💛": "heart",
    "🛡️": "shield",
    "👑": "crown",
    "🎓": "graduation-cap",
    "📷": "camera",
    "📸": "camera",
    "📖": "book",
    "🎤": "mic",
    "⚡": "zap",
    "🚩": "flag",
};

async function main() {
    const badges = await prisma.badge.findMany({select: {id: true, name: true, icon: true}});

    let updated = 0;
    for (const badge of badges) {
        if (!badge.icon) continue;

        const mapped = EMOJI_TO_ICON[badge.icon];
        if (mapped) {
            await prisma.badge.update({where: {id: badge.id}, data: {icon: mapped}});
            console.log(`  "${badge.name}": ${badge.icon} → ${mapped}`);
            updated++;
        } else if (!Object.values(EMOJI_TO_ICON).includes(badge.icon)) {
            console.warn(`  "${badge.name}": unknown icon "${badge.icon}" — left unchanged`);
        }
    }

    console.log(`\nDone. Updated ${updated} badge${updated !== 1 ? "s" : ""}.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
