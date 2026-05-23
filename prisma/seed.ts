import "dotenv/config";
import {PrismaClient} from "../src/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    ssl: {rejectUnauthorized: false},
});
const prisma = new PrismaClient({adapter} as never);

function slugify(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

async function main() {
    console.log("Seeding...");

    // ── Badges ──────────────────────────────────────────────────────────────
    const badges = await Promise.all([
        prisma.badge.create({
            data: {
                name: "First Event",
                description: "Volunteered at their very first ESN event",
                icon: "star"
            }
        }),
        prisma.badge.create({
            data: {
                name: "100 Events",
                description: "Participated in 100 or more events",
                icon: "trophy"
            }
        }),
        prisma.badge.create({
            data: {
                name: "Best Buddy",
                description: "Recognised for outstanding buddy mentorship",
                icon: "users"
            }
        }),
        prisma.badge.create({
            data: {
                name: "Board Member",
                description: "Served on the section board",
                icon: "landmark"
            }
        }),
        prisma.badge.create({
            data: {
                name: "OAG Delegate",
                description: "Represented the section at an OAG",
                icon: "plane"
            }
        }),
    ]);

    const [badgeFirst, badge100, badgeBuddy, badgeBoard, badgeOAG] = badges;

    // ── Members ─────────────────────────────────────────────────────────────
    const membersData = [
        // Alumni — were active across multiple mandates
        {
            fullName: "Ana Ferreira",
            joinedAt: "2019-09-01",
            leftAt: "2023-06-30",
            isAlumni: true,
            bio: "Founding member of the Projects team. Turned every bureaucratic nightmare into a well-organised spreadsheet.",
            favouriteMemory: "The night we stayed until 4am building the welcome fair booth out of cardboard and wishful thinking."
        },
        {
            fullName: "Bruno Martins",
            joinedAt: "2019-09-01",
            leftAt: "2022-06-30",
            isAlumni: true,
            bio: "Social media guru and photographer. His candid shots defined the visual identity of three mandates.",
            favouriteMemory: "Spontaneous trip to Porto after the national platform. We missed the last train and it was perfect."
        },
        {
            fullName: "Catarina Sousa",
            joinedAt: "2020-09-01",
            leftAt: "2023-06-30",
            isAlumni: true,
            bio: "HR Director for two consecutive years. Onboarded over 60 newbies and remembered every single name.",
            favouriteMemory: "The integration camp where it rained for two days straight and nobody cared."
        },
        {
            fullName: "Diogo Almeida",
            joinedAt: "2020-09-01",
            leftAt: "2024-06-30",
            isAlumni: true,
            bio: "IT Director. Migrated the section off Google Sheets — twice. Built more internal tools than anyone can count.",
            favouriteMemory: "Deploying the event registration system at midnight before the deadline. It worked first try."
        },

        // Seniors — long-standing active members
        {
            fullName: "Elena Rodrigues",
            joinedAt: "2021-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "Cultural programme lead. Brings a new country to life every month through food, film, and sheer enthusiasm.",
            favouriteMemory: "Czech Night. We made svíčková from scratch, starting at 7am. Worth every minute."
        },
        {
            fullName: "Francisco Costa",
            joinedAt: "2021-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "International student liaison and buddy coordinator for three years running.",
            favouriteMemory: "Watching a newbie from Japan give a speech in broken Portuguese at the farewell party."
        },
        {
            fullName: "Gabriela Lima",
            joinedAt: "2022-02-01",
            leftAt: null,
            isAlumni: false,
            bio: "Activities director. Invented the concept of the monthly mystery trip — destination revealed on the bus.",
            favouriteMemory: "The mystery trip that turned out to be a cheese farm. Nobody guessed cheese."
        },

        // Juniors
        {
            fullName: "Henrique Santos",
            joinedAt: "2022-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "Events logistics. Never shows up without a printed checklist and a backup plan.",
            favouriteMemory: "Our first in-person event after the pandemic. I cried a little. We all did."
        },
        {
            fullName: "Inês Carvalho",
            joinedAt: "2022-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "Communications and design. Responsible for the aesthetic rebrand that made everyone stop scrolling.",
            favouriteMemory: "Designing the welcome pack at 2am with bad coffee and good music."
        },
        {
            fullName: "João Pereira",
            joinedAt: "2023-02-01",
            leftAt: null,
            isAlumni: false,
            bio: "Projects coordinator. Wrote the section's first successful Erasmus+ application.",
            favouriteMemory: "The moment we found out the Erasmus+ project got funded. Group call, everyone screaming."
        },

        // Candidate Members
        {
            fullName: "Kira Novak",
            joinedAt: "2023-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "Erasmus student from Slovenia, joined as a volunteer after her first ESN event.",
            favouriteMemory: "My first Welcome Week — I came as a participant and stayed as a volunteer."
        },
        {
            fullName: "Lucas Oliveira",
            joinedAt: "2023-09-01",
            leftAt: null,
            isAlumni: false,
            bio: "Finance and sponsorship. Convinced three local businesses to sponsor ESN events.",
            favouriteMemory: "Getting our first sponsorship deal. The look on the board's faces was priceless."
        },
        {
            fullName: "Mariana Gomes",
            joinedAt: "2024-02-01",
            leftAt: null,
            isAlumni: false,
            bio: "Social media and content creation. Grew the Instagram following by 40% in one semester.",
            favouriteMemory: "The reel I made of the integration camp going viral (for ESN standards)."
        },

        // Newbies
        {
            fullName: "Nuno Figueiredo",
            joinedAt: "2024-09-01",
            leftAt: null,
            isAlumni: false,
            bio: null,
            favouriteMemory: null
        },
        {
            fullName: "Olga Petrenko",
            joinedAt: "2024-09-01",
            leftAt: null,
            isAlumni: false,
            bio: null,
            favouriteMemory: null
        },
        {
            fullName: "Pedro Azevedo",
            joinedAt: "2024-09-01",
            leftAt: null,
            isAlumni: false,
            bio: null,
            favouriteMemory: null
        },
    ];

    const members = await Promise.all(
        membersData.map((m) =>
            prisma.member.create({
                data: {
                    slug: slugify(m.fullName),
                    fullName: m.fullName,
                    joinedAt: new Date(m.joinedAt),
                    leftAt: m.leftAt ? new Date(m.leftAt) : null,
                    isAlumni: m.isAlumni,
                    bio: m.bio,
                    favouriteMemory: m.favouriteMemory,
                },
            })
        )
    );

    const [ana, bruno, catarina, diogo, elena, francisco, gabriela, henrique, ines, joao, kira, lucas, mariana, nuno, olga, pedro] = members;

    // ── Status histories ─────────────────────────────────────────────────────
    const statusData: Array<{
        memberId: string;
        statuses: Array<{ status: string; startedAt: string; endedAt: string | null }>
    }> = [
        {
            memberId: ana.id, statuses: [
                {status: "NEWBIE", startedAt: "2019-09-01", endedAt: "2019-12-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2019-12-01", endedAt: "2020-06-01"},
                {status: "JUNIOR", startedAt: "2020-06-01", endedAt: "2021-06-01"},
                {status: "SENIOR", startedAt: "2021-06-01", endedAt: "2022-06-01"},
                {status: "ALUMNI", startedAt: "2022-06-01", endedAt: null},
            ]
        },
        {
            memberId: bruno.id, statuses: [
                {status: "NEWBIE", startedAt: "2019-09-01", endedAt: "2020-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2020-02-01", endedAt: "2020-09-01"},
                {status: "JUNIOR", startedAt: "2020-09-01", endedAt: "2021-06-01"},
                {status: "SENIOR", startedAt: "2021-06-01", endedAt: "2022-06-01"},
                {status: "ALUMNI", startedAt: "2022-06-01", endedAt: null},
            ]
        },
        {
            memberId: catarina.id, statuses: [
                {status: "NEWBIE", startedAt: "2020-09-01", endedAt: "2021-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2021-02-01", endedAt: "2021-09-01"},
                {status: "JUNIOR", startedAt: "2021-09-01", endedAt: "2022-06-01"},
                {status: "SENIOR", startedAt: "2022-06-01", endedAt: "2023-06-01"},
                {status: "ALUMNI", startedAt: "2023-06-01", endedAt: null},
            ]
        },
        {
            memberId: diogo.id, statuses: [
                {status: "NEWBIE", startedAt: "2020-09-01", endedAt: "2021-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2021-02-01", endedAt: "2021-09-01"},
                {status: "JUNIOR", startedAt: "2021-09-01", endedAt: "2022-06-01"},
                {status: "SENIOR", startedAt: "2022-06-01", endedAt: "2024-06-01"},
                {status: "ALUMNI", startedAt: "2024-06-01", endedAt: null},
            ]
        },
        {
            memberId: elena.id, statuses: [
                {status: "NEWBIE", startedAt: "2021-09-01", endedAt: "2022-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2022-02-01", endedAt: "2022-09-01"},
                {status: "JUNIOR", startedAt: "2022-09-01", endedAt: "2023-06-01"},
                {status: "SENIOR", startedAt: "2023-06-01", endedAt: null},
            ]
        },
        {
            memberId: francisco.id, statuses: [
                {status: "NEWBIE", startedAt: "2021-09-01", endedAt: "2022-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2022-02-01", endedAt: "2022-09-01"},
                {status: "JUNIOR", startedAt: "2022-09-01", endedAt: "2023-06-01"},
                {status: "SENIOR", startedAt: "2023-06-01", endedAt: null},
            ]
        },
        {
            memberId: gabriela.id, statuses: [
                {status: "NEWBIE", startedAt: "2022-02-01", endedAt: "2022-09-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2022-09-01", endedAt: "2023-02-01"},
                {status: "JUNIOR", startedAt: "2023-02-01", endedAt: "2024-06-01"},
                {status: "SENIOR", startedAt: "2024-06-01", endedAt: null},
            ]
        },
        {
            memberId: henrique.id, statuses: [
                {status: "NEWBIE", startedAt: "2022-09-01", endedAt: "2023-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2023-02-01", endedAt: "2023-09-01"},
                {status: "JUNIOR", startedAt: "2023-09-01", endedAt: null},
            ]
        },
        {
            memberId: ines.id, statuses: [
                {status: "NEWBIE", startedAt: "2022-09-01", endedAt: "2023-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2023-02-01", endedAt: "2023-09-01"},
                {status: "JUNIOR", startedAt: "2023-09-01", endedAt: null},
            ]
        },
        {
            memberId: joao.id, statuses: [
                {status: "NEWBIE", startedAt: "2023-02-01", endedAt: "2023-09-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2023-09-01", endedAt: "2024-02-01"},
                {status: "JUNIOR", startedAt: "2024-02-01", endedAt: null},
            ]
        },
        {
            memberId: kira.id, statuses: [
                {status: "NEWBIE", startedAt: "2023-09-01", endedAt: "2024-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2024-02-01", endedAt: null},
            ]
        },
        {
            memberId: lucas.id, statuses: [
                {status: "NEWBIE", startedAt: "2023-09-01", endedAt: "2024-02-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2024-02-01", endedAt: null},
            ]
        },
        {
            memberId: mariana.id, statuses: [
                {status: "NEWBIE", startedAt: "2024-02-01", endedAt: "2024-09-01"},
                {status: "CANDIDATE_MEMBER", startedAt: "2024-09-01", endedAt: null},
            ]
        },
        {memberId: nuno.id, statuses: [{status: "NEWBIE", startedAt: "2024-09-01", endedAt: null}]},
        {memberId: olga.id, statuses: [{status: "NEWBIE", startedAt: "2024-09-01", endedAt: null}]},
        {memberId: pedro.id, statuses: [{status: "NEWBIE", startedAt: "2024-09-01", endedAt: null}]},
    ];

    await Promise.all(
        statusData.flatMap(({memberId, statuses}) =>
            statuses.map((s) =>
                prisma.statusHistory.create({
                    data: {
                        memberId,
                        status: s.status as never,
                        startedAt: new Date(s.startedAt),
                        endedAt: s.endedAt ? new Date(s.endedAt) : null,
                    },
                })
            )
        )
    );

    // ── Buddy links ──────────────────────────────────────────────────────────
    await Promise.all([
        prisma.buddyLink.create({data: {buddyId: ana.id, newbieId: elena.id, linkedAt: new Date("2021-09-15")}}),
        prisma.buddyLink.create({
            data: {
                buddyId: catarina.id,
                newbieId: francisco.id,
                linkedAt: new Date("2021-09-15")
            }
        }),
        prisma.buddyLink.create({data: {buddyId: diogo.id, newbieId: gabriela.id, linkedAt: new Date("2022-02-10")}}),
        prisma.buddyLink.create({data: {buddyId: elena.id, newbieId: henrique.id, linkedAt: new Date("2022-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: francisco.id, newbieId: ines.id, linkedAt: new Date("2022-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: gabriela.id, newbieId: joao.id, linkedAt: new Date("2023-02-10")}}),
        prisma.buddyLink.create({data: {buddyId: henrique.id, newbieId: kira.id, linkedAt: new Date("2023-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: ines.id, newbieId: lucas.id, linkedAt: new Date("2023-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: joao.id, newbieId: mariana.id, linkedAt: new Date("2024-02-10")}}),
        prisma.buddyLink.create({data: {buddyId: kira.id, newbieId: nuno.id, linkedAt: new Date("2024-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: lucas.id, newbieId: olga.id, linkedAt: new Date("2024-09-15")}}),
        prisma.buddyLink.create({data: {buddyId: mariana.id, newbieId: pedro.id, linkedAt: new Date("2024-09-15")}}),
    ]);

    // ── Tributes ─────────────────────────────────────────────────────────────
    await Promise.all([
        prisma.tribute.create({
            data: {
                authorId: bruno.id,
                recipientId: ana.id,
                message: "Ana taught me that a good spreadsheet is a form of love. She organised three years of chaos with a smile."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: catarina.id,
                recipientId: ana.id,
                message: "No one understood the section's soul better than Ana. She set the bar for everyone who came after."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: ana.id,
                recipientId: catarina.id,
                message: "Cat remembered every newbie's name, hometown, and favourite food. That is not a skill, it is a superpower."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: elena.id,
                recipientId: catarina.id,
                message: "My buddy, my mentor, and somehow also my friend. Joining ESN would have been terrifying without her."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: diogo.id,
                recipientId: bruno.id,
                message: "The section's unofficial historian. Every great memory from those years has a Bruno photo attached to it."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: gabriela.id,
                recipientId: diogo.id,
                message: "Diogo built the tools that made us professional. Quietly, without ever asking for credit."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: henrique.id,
                recipientId: elena.id,
                message: "Elena turns cultural events into actual experiences. I came for the free food, I stayed for everything else."
            }
        }),
        prisma.tribute.create({
            data: {
                authorId: kira.id,
                recipientId: francisco.id,
                message: "Francisco was the reason I stopped being just a participant and became a volunteer."
            }
        }),
    ]);

    // ── Mandates ─────────────────────────────────────────────────────────────
    const mandate1 = await prisma.mandate.create({
        data: {
            name: "Board 2021/22",
            academicYear: "2021/22",
            startsAt: new Date("2021-09-01"),
            endsAt: new Date("2022-06-30"),
            colorIndex: 0,
        },
    });

    const mandate2 = await prisma.mandate.create({
        data: {
            name: "Board 2022/23",
            academicYear: "2022/23",
            startsAt: new Date("2022-09-01"),
            endsAt: new Date("2023-06-30"),
            colorIndex: 1,
        },
    });

    const mandate3 = await prisma.mandate.create({
        data: {
            name: "Board 2024/25",
            academicYear: "2024/25",
            startsAt: new Date("2024-09-01"),
            endsAt: new Date("2025-06-30"),
            colorIndex: 2,
        },
    });

    // ── Mandate memberships ──────────────────────────────────────────────────
    await Promise.all([
        // 2021/22
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: ana.id,
                departments: ["Board"],
                roleTitles: ["President"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: catarina.id,
                departments: ["Board"],
                roleTitles: ["HR Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: diogo.id,
                departments: ["Board"],
                roleTitles: ["IT Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: bruno.id,
                departments: ["Communications"],
                roleTitles: ["Social Media Manager"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: elena.id,
                departments: ["Cultural"],
                roleTitles: ["Cultural Coordinator"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate1.id,
                memberId: francisco.id,
                departments: ["Activities"],
                roleTitles: ["Activities Coordinator"]
            }
        }),

        // 2022/23
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: elena.id,
                departments: ["Board"],
                roleTitles: ["President"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: francisco.id,
                departments: ["Board"],
                roleTitles: ["HR Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: gabriela.id,
                departments: ["Board"],
                roleTitles: ["Activities Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: henrique.id,
                departments: ["Activities"],
                roleTitles: ["Events Coordinator"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: ines.id,
                departments: ["Communications"],
                roleTitles: ["Designer"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate2.id,
                memberId: joao.id,
                departments: ["Projects"],
                roleTitles: ["Projects Coordinator"]
            }
        }),

        // 2024/25
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: gabriela.id,
                departments: ["Board"],
                roleTitles: ["President"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: joao.id,
                departments: ["Board"],
                roleTitles: ["HR Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: lucas.id,
                departments: ["Board"],
                roleTitles: ["Finance Director"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: mariana.id,
                departments: ["Communications"],
                roleTitles: ["Social Media Manager"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: kira.id,
                departments: ["Activities"],
                roleTitles: ["International Coordinator"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: henrique.id,
                departments: ["Activities"],
                roleTitles: ["Events Coordinator"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: nuno.id,
                departments: ["Cultural"],
                roleTitles: ["Cultural Volunteer"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: olga.id,
                departments: ["Cultural"],
                roleTitles: ["Cultural Volunteer"]
            }
        }),
        prisma.mandateMembership.create({
            data: {
                mandateId: mandate3.id,
                memberId: pedro.id,
                departments: ["Activities"],
                roleTitles: ["Activities Volunteer"]
            }
        }),
    ]);

    // ── Milestones ───────────────────────────────────────────────────────────
    await Promise.all([
        prisma.milestone.create({
            data: {
                title: "Section Founded",
                happenedAt: new Date("2008-10-15"),
                type: "FIRST",
                description: "ESN Aveiro officially registered as an ESN section."
            }
        }),
        prisma.milestone.create({
            data: {
                title: "First Welcome Week",
                happenedAt: new Date("2009-02-01"),
                type: "FIRST",
                description: "First full Welcome Week programme — 12 Erasmus students attended."
            }
        }),
        prisma.milestone.create({
            data: {
                title: "100th Member",
                happenedAt: new Date("2015-03-20"),
                type: "FIRST",
                description: "Reached 100 registered members across all active statuses."
            }
        }),
        prisma.milestone.create({
            data: {
                title: "Best Section Award",
                happenedAt: new Date("2019-04-01"),
                type: "AWARD",
                description: "Awarded Best Section at the ESN Portugal National Platform.",
                mandateId: mandate1.id
            }
        }),
        prisma.milestone.create({
            data: {
                title: "First Erasmus+ Project Approved",
                happenedAt: new Date("2023-05-15"),
                type: "FIRST",
                description: "Secured first Erasmus+ KA1 mobility project funding.",
                mandateId: mandate2.id
            }
        }),
        prisma.milestone.create({
            data: {
                title: "500 Events Milestone",
                happenedAt: new Date("2024-03-01"),
                type: "EVENT",
                description: "The section reached 500 cumulative events organised since founding.",
                mandateId: mandate3.id
            }
        }),
    ]);

    // ── Events ───────────────────────────────────────────────────────────────
    const event1 = await prisma.event.create({
        data: {
            title: "Welcome Week Spring 2022",
            description: "Full week of activities welcoming the spring semester Erasmus intake.",
            locationName: "Aveiro",
            scope: "LOCAL",
            eventType: "ACTIVITIES",
            startsAt: new Date("2022-02-07"),
            endsAt: new Date("2022-02-11"),
            mandateId: mandate1.id,
        },
    });

    const event2 = await prisma.event.create({
        data: {
            title: "Czech Night",
            description: "Cultural evening dedicated to Czech Republic — traditional food, music, and games.",
            locationName: "Casa do Povo, Aveiro",
            scope: "LOCAL",
            eventType: "CULTURAL",
            startsAt: new Date("2022-04-08"),
            endsAt: new Date("2022-04-08"),
            mandateId: mandate1.id,
        },
    });

    const event3 = await prisma.event.create({
        data: {
            title: "ESN Portugal National Platform",
            description: "Annual meeting of all Portuguese ESN sections.",
            locationName: "Lisboa",
            scope: "NATIONAL",
            eventType: "PROJECTS",
            startsAt: new Date("2022-11-18"),
            endsAt: new Date("2022-11-20"),
            mandateId: mandate2.id,
        },
    });

    const event4 = await prisma.event.create({
        data: {
            title: "Integration Camp 2023",
            description: "Weekend camp for new members and Erasmus students to connect outside the city.",
            locationName: "Serra da Freita",
            scope: "LOCAL",
            eventType: "ACTIVITIES",
            startsAt: new Date("2023-10-20"),
            endsAt: new Date("2023-10-22"),
            mandateId: mandate3.id,
        },
    });

    const event5 = await prisma.event.create({
        data: {
            title: "Welcome Week Autumn 2024",
            description: "Autumn semester welcome programme for the largest Erasmus intake in section history.",
            locationName: "Aveiro",
            scope: "LOCAL",
            eventType: "ACTIVITIES",
            startsAt: new Date("2024-09-09"),
            endsAt: new Date("2024-09-13"),
            mandateId: mandate3.id,
        },
    });

    // ── Event participations ─────────────────────────────────────────────────
    await Promise.all([
        // Welcome Week Spring 2022
        prisma.eventParticipation.create({data: {eventId: event1.id, memberId: ana.id, role: "Coordinator"}}),
        prisma.eventParticipation.create({data: {eventId: event1.id, memberId: catarina.id, role: "Coordinator"}}),
        prisma.eventParticipation.create({data: {eventId: event1.id, memberId: elena.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event1.id, memberId: francisco.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event1.id, memberId: bruno.id, role: "Photographer"}}),

        // Czech Night
        prisma.eventParticipation.create({data: {eventId: event2.id, memberId: elena.id, role: "Lead Organiser"}}),
        prisma.eventParticipation.create({data: {eventId: event2.id, memberId: francisco.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event2.id, memberId: gabriela.id, role: "Volunteer"}}),

        // National Platform
        prisma.eventParticipation.create({data: {eventId: event3.id, memberId: elena.id, role: "Delegate"}}),
        prisma.eventParticipation.create({data: {eventId: event3.id, memberId: francisco.id, role: "Delegate"}}),
        prisma.eventParticipation.create({data: {eventId: event3.id, memberId: gabriela.id, role: "Observer"}}),

        // Integration Camp 2023
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: gabriela.id, role: "Coordinator"}}),
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: henrique.id, role: "Logistics"}}),
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: ines.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: joao.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: kira.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event4.id, memberId: lucas.id, role: "Volunteer"}}),

        // Welcome Week Autumn 2024
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: gabriela.id, role: "Coordinator"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: joao.id, role: "Coordinator"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: kira.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: lucas.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: mariana.id, role: "Photographer"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: nuno.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: olga.id, role: "Volunteer"}}),
        prisma.eventParticipation.create({data: {eventId: event5.id, memberId: pedro.id, role: "Volunteer"}}),
    ]);

    // ── Badge awards ─────────────────────────────────────────────────────────
    await Promise.all([
        prisma.memberBadge.create({
            data: {
                memberId: ana.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2021-09-01")
            }
        }),
        prisma.memberBadge.create({data: {memberId: ana.id, badgeId: badgeOAG.id, awardedAt: new Date("2022-03-01")}}),
        prisma.memberBadge.create({
            data: {
                memberId: catarina.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2021-09-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: catarina.id,
                badgeId: badgeBuddy.id,
                awardedAt: new Date("2022-06-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: diogo.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2021-09-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: elena.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2022-09-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: elena.id,
                badgeId: badgeBuddy.id,
                awardedAt: new Date("2023-06-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: elena.id,
                badgeId: badgeFirst.id,
                awardedAt: new Date("2021-10-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: francisco.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2022-09-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: francisco.id,
                badgeId: badgeBuddy.id,
                awardedAt: new Date("2023-06-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: gabriela.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2024-09-01")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: joao.id,
                badgeId: badgeBoard.id,
                awardedAt: new Date("2024-09-01")
            }
        }),
        prisma.memberBadge.create({data: {memberId: joao.id, badgeId: badge100.id, awardedAt: new Date("2025-01-01")}}),
        prisma.memberBadge.create({
            data: {
                memberId: nuno.id,
                badgeId: badgeFirst.id,
                awardedAt: new Date("2024-09-09")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: olga.id,
                badgeId: badgeFirst.id,
                awardedAt: new Date("2024-09-09")
            }
        }),
        prisma.memberBadge.create({
            data: {
                memberId: pedro.id,
                badgeId: badgeFirst.id,
                awardedAt: new Date("2024-09-09")
            }
        }),
    ]);

    console.log("Done. Seeded:");
    console.log(`  ${members.length} members`);
    console.log(`  3 mandates`);
    console.log(`  5 events`);
    console.log(`  6 milestones`);
    console.log(`  5 badges`);
    console.log(`  12 buddy links`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
