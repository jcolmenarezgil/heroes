# Heroes

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** NextAuth.js v4
- **Deployment:** Vercel

## Project Structure

Everything lives under `src/`. The `@/` path alias maps to `./src/*`.

```
src/
├── app/                  # App Router pages and API routes
│   ├── api/auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/           # UI components
├── lib/                  # Core services
│   ├── auth.ts           # NextAuth config
│   └── db/
│       ├── client.ts     # DB client
│       └── schema.ts     # Drizzle schemas
```

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
cp .env.example .env.local   # Drizzle Kit reads from .env.local
```

- `DATABASE_URL` — PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials (Google Cloud Console)
- `NEXTAUTH_SECRET` — Random string (32+ chars) for session encryption (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — App base URL (e.g. `http://localhost:3000`)
- `ADMIN_EMAILS` — Comma-separated list of admin email addresses
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token for photo uploads

The `.env` and `.env.local` files are gitignored.

## Getting Started

```bash
pnpm install
pnpm dev            # starts dev server with Turbopack
pnpm db:generate    # generate migrations (reads .env.local)
pnpm db:migrate     # apply migrations to the database (reads .env.local)
pnpm db:studio      # open Drizzle Studio (reads .env.local)
```

## Participants

- **Natanael da Matta:** *"What we know is a drop, what we don't know is an ocean."*
- **Jose Colmenarez:** *"The best way to predict the future is to invent it."*
