# Contributing

Bug reports, feature ideas, and pull requests are welcome.

---

## Local development

### Requirements

- Node.js 20+
- A Supabase project (see [docs/SETUP.md](docs/SETUP.md))

### Setup

```bash
git clone https://github.com/your-org/esn-chapters.git
cd esn-chapters
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npx prisma migrate dev        # apply schema to your dev database
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

After pulling changes that include schema updates, run `npx prisma migrate dev` and `npx prisma generate` to stay in
sync.

---

## Project structure

```
esn-chapters/
├── prisma/
│   ├── schema.prisma          # All models and enums
│   └── migrations/            # Migration history (committed)
├── prisma.config.ts           # Prisma 7 config — DB URL lives here
├── src/
│   ├── actions/               # Server actions — all write operations go here
│   ├── app/
│   │   ├── (public)/          # Public routes — no auth required
│   │   └── admin/             # Admin routes — middleware enforces auth
│   ├── components/
│   │   ├── public/            # Components used on public pages
│   │   └── ui/                # Shared primitives (Button, Badge, Input)
│   ├── generated/prisma/      # Auto-generated — do not edit
│   ├── lib/
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── supabase/          # Supabase client factories (browser + server)
│   │   └── utils.ts           # Shared helpers and design constants
│   └── types/index.ts         # Shared TypeScript types
└── middleware.ts               # Auth guard — redirects /admin if not logged in
```

### Key conventions

- **Server Components by default.** Add `"use client"` only when you need browser APIs, event handlers, or React state.
- **All mutations are Server Actions** in `src/actions/`. Each action calls `requireAuth()` before touching the
  database.
- **`export const dynamic = "force-dynamic"`** on every page that fetches from the database, to prevent Next.js from
  attempting static generation.
- **Prisma 7** generates the client to `src/generated/prisma/`. Import types from `@/generated/prisma` and the client
  from `@/lib/prisma`. Never import from `@prisma/client`.
- **Design tokens** are CSS custom properties in `src/app/globals.css`. Use `var(--color-*)`, `var(--text-*)` etc. in
  inline styles rather than hardcoded values.

---

## Making changes

### Schema changes

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <short-description>`
3. Run `npx prisma generate` if the migration only changed types without a data migration

Commit the generated migration file in `prisma/migrations/`. Do not commit `src/generated/prisma/` — it is in
`.gitignore` and regenerated on install/deploy.

### Adding a new admin page

1. Create the route under `src/app/admin/`
2. The middleware in `middleware.ts` already protects all `/admin/*` routes
3. Add a link to the sidebar in `src/app/admin/layout.tsx`

### Adding a new public page

1. Create the route under `src/app/(public)/`
2. Add `export const dynamic = "force-dynamic"` at the top if the page fetches data
3. Add a link to `src/components/public/Nav.tsx` if it belongs in the main navigation

---

## Before submitting a PR

- Run `npm run build` — the build must pass with no TypeScript errors
- Keep the PR focused on one concern
- Do not commit `.env.local`, credentials, or `src/generated/prisma/`
- For significant changes (new features, schema changes, auth logic), open an issue first to discuss the approach

---

## Reporting issues

Open a GitHub issue with:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your Node.js version and whether you're on Vercel or self-hosted
