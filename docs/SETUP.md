# Setup Guide

This guide walks through everything needed to run your own ESN Chronicle instance — from a fresh fork to a live deployment.

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works)
- npm

---

## 1. Clone and install

```bash
git clone https://github.com/your-org/esn-chronicle.git
cd esn-chronicle
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Wait for the database to provision (~2 minutes)

---

## 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
# Your section's name — shown in the nav, hero, page title, and admin panel
NEXT_PUBLIC_SECTION_NAME="ESN Porto"

# Supabase → Project Settings → Database → Connection string → URI
# Use Session mode (port 5432) — NOT Transaction mode (port 6543)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres

# Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Session mode vs Transaction mode**: Prisma's migration engine requires a persistent connection. Always use the Session mode URL (port 5432). Transaction mode (port 6543) will cause `prisma migrate` to fail.

---

## 4. Run database migrations

```bash
npx prisma migrate dev --name init
```

This applies the schema to your Supabase database. Verify the tables appeared in Supabase → Table Editor.

If you add schema changes later, run:

```bash
npx prisma migrate dev --name <description>
```

---

## 5. Create Storage buckets

In Supabase → Storage, create two **public** buckets, or run this in the SQL Editor:

```sql
insert into storage.buckets (id, name, public)
values
  ('member-photos', 'member-photos', true),
  ('mandate-photos', 'mandate-photos', true);
```

---

## 6. Apply Row Level Security policies

Run the following in Supabase → SQL Editor. This allows anyone to read data (public site) and only authenticated admins to write.

```sql
-- Enable RLS on all tables
alter table member enable row level security;
alter table mandate enable row level security;
alter table mandate_membership enable row level security;
alter table status_history enable row level security;
alter table buddy_link enable row level security;
alter table tribute enable row level security;
alter table milestone enable row level security;
alter table badge enable row level security;
alter table member_badge enable row level security;
alter table event enable row level security;
alter table event_participation enable row level security;

-- Public read
create policy "Public read" on member for select using (true);
create policy "Public read" on mandate for select using (true);
create policy "Public read" on mandate_membership for select using (true);
create policy "Public read" on status_history for select using (true);
create policy "Public read" on buddy_link for select using (true);
create policy "Public read" on tribute for select using (true);
create policy "Public read" on milestone for select using (true);
create policy "Public read" on badge for select using (true);
create policy "Public read" on member_badge for select using (true);
create policy "Public read" on event for select using (true);
create policy "Public read" on event_participation for select using (true);

-- Authenticated write
create policy "Auth write" on member for all using (auth.role() = 'authenticated');
create policy "Auth write" on mandate for all using (auth.role() = 'authenticated');
create policy "Auth write" on mandate_membership for all using (auth.role() = 'authenticated');
create policy "Auth write" on status_history for all using (auth.role() = 'authenticated');
create policy "Auth write" on buddy_link for all using (auth.role() = 'authenticated');
create policy "Auth write" on tribute for all using (auth.role() = 'authenticated');
create policy "Auth write" on milestone for all using (auth.role() = 'authenticated');
create policy "Auth write" on badge for all using (auth.role() = 'authenticated');
create policy "Auth write" on member_badge for all using (auth.role() = 'authenticated');
create policy "Auth write" on event for all using (auth.role() = 'authenticated');
create policy "Auth write" on event_participation for all using (auth.role() = 'authenticated');

-- Storage: public read
create policy "Public read member photos"
  on storage.objects for select using (bucket_id = 'member-photos');

create policy "Public read mandate photos"
  on storage.objects for select using (bucket_id = 'mandate-photos');

-- Storage: authenticated upload
create policy "Auth upload member photos"
  on storage.objects for insert
  with check (bucket_id = 'member-photos' and auth.role() = 'authenticated');

create policy "Auth upload mandate photos"
  on storage.objects for insert
  with check (bucket_id = 'mandate-photos' and auth.role() = 'authenticated');
```

---

## 7. Create the first admin user

In Supabase → Authentication → Users, click **Invite user** and enter the email address of your IT Manager. They will receive an email to set their password.

Once the app is running, any admin can invite additional admins from the `/admin/settings` page.

---

## 8. Start the dev server

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Customising for your section

### Section name

Set `NEXT_PUBLIC_SECTION_NAME` in your `.env.local` (and in your deployment environment). This value flows through `src/lib/config.ts` to the nav, page title, login page, and admin panel — no file edits needed.

### Colours and design tokens

All visual tokens are CSS custom properties in `src/app/globals.css`:

```css
:root {
  --color-esn: #003DA5;     /* primary brand colour */
  --color-accent: #C4622D;  /* warm accent */
  --color-bg: #F8F6F2;      /* page background */
  /* typography, spacing, shadows... */
}
```

### Mandate colours

`src/lib/utils.ts` exports `MANDATE_COLORS` — an array of 8 hex colours cycled per mandate. Edit this to match your section's palette.

### Member statuses

The status progression (`NEWBIE → CANDIDATE_MEMBER → JUNIOR → SENIOR → ALUMNI`) is defined as a Postgres enum. To change it:

1. Edit the `MemberStatus` enum in `prisma/schema.prisma`
2. Update `STATUS_LABELS` and `STATUS_COLORS` in `src/lib/utils.ts`
3. Run `npx prisma migrate dev --name update-statuses`

---

## Deployment

### Vercel (recommended)

1. Push your fork to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add the four environment variables under Settings → Environment Variables
4. Deploy — Vercel detects Next.js automatically

### Self-hosted

Any Node.js host works:

```bash
npm run build
npm start
```

Set the four environment variables in your host's environment config.

**Custom image domains**: if your Supabase project uses a custom storage domain, add it to `remotePatterns` in `next.config.ts`.

---

## Troubleshooting

**`prisma migrate dev` fails with connection error**
Confirm you're using the Session mode URL (port 5432), not Transaction mode (port 6543).

**Images not loading in production**
Check that your Supabase project URL matches the `*.supabase.co` pattern in `next.config.ts`. If you use a custom domain for storage, add it explicitly.

**Admin login redirects back to login**
Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly in your deployment environment — not just in `.env.local`.

**`Module not found: @/generated/prisma`**
Run `npx prisma generate` to regenerate the client after cloning or pulling schema changes.
