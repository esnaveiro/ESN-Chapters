# ESN Chapters

A living archive for ESN sections — preserving volunteers, mandates, events, and the connections between people across every year of a section's history.

Built by [ESN Aveiro](https://esnaveiro.org) and open-sourced so any ESN section can run their own instance.

---

## What it does

| View | Description |
|---|---|
| **Members** | Yearbook-style directory of every volunteer, past and present, grouped by mandate cohort |
| **Mandates** | Board terms by academic year, with team portrait grid and events/milestones per mandate |
| **Timeline** | Horizontal chronological history — mandates, milestones, and events in one scroll |
| **Network** | Graph of buddy relationships across all members |
| **Admin panel** | HR and IT manager interfaces for managing all data |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| ORM | Prisma 7 |
| Auth | Supabase Auth (email/password, invite-only) |
| Storage | Supabase Storage |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Deployment | Vercel (recommended) |

---

## Quick start

```bash
git clone https://github.com/your-org/esn-chapters.git
cd esn-chapters
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev
```

For the full setup — Supabase project, database migrations, storage buckets, RLS policies, and first admin user — see **[docs/SETUP.md](docs/SETUP.md)**.

---

## Documentation

| Document | Description |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Full setup guide for sections forking this project |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Day-to-day guide for HR and IT managers |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Local dev workflow and PR guidelines |

---

## Forking for your section

Each fork is a fully independent instance — no data is shared between sections. After forking, follow [docs/SETUP.md](docs/SETUP.md) then see the customisation section to update your section name, colours, and member statuses.

---

## License

MIT — free to use, modify, and deploy for any ESN section.
