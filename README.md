# Heroes

## Tech Stack

- **Framework:** Next.js 15 (App Router)
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
```

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random string (32+ chars) for session encryption
- `NEXTAUTH_URL` — App base URL (e.g. `http://localhost:3000`)

The `.env` file is gitignored.

## Getting Started

```bash
pnpm install
pnpm dev            # starts dev server with Turbopack
pnpm db:generate    # generate migrations
pnpm db:push       # push schema to database
```

## Participants

- **Natanael da Matta:** *"What we know is a drop, what we don't know is an ocean."*
- **Jose Colmenarez:** *"The best way to predict the future is to invent it."*
