# Contributing to Heroes

Thanks for wanting to help out! Heroes is a free, open-source, non-profit project for
emergency response and locating missing persons. 

This guide covers how to set up the project and contribute changes.

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (this repo uses `pnpm-lock.yaml` — do not use npm or yarn)
- **PostgreSQL** (local or hosted)

### Setup

```bash
pnpm install
cp .env.example .env     # then fill in your values (see below)
pnpm db:migrate          # apply database migrations
pnpm dev                 # start dev server (Turbopack) at http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (`postgres://user:pass@host:5432/db`) |
| `GOOGLE_CLIENT_ID` | yes | Google OAuth client ID (Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | yes | Google OAuth client secret |
| `NEXTAUTH_SECRET` | yes | 32+ char random string for session encryption (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | yes | App base URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAILS` | no | Comma-separated emails promoted to `admin` on sign-in |
| `ALLOWED_EMAILS` | no | Optional comma-separated allowlist of emails that may sign in. When set, only these (and `ADMIN_EMAILS`) may join; unset = open registration to any Google account |

`.env` is gitignored.

## Project Structure

Everything lives under `src/`. The `@/` path alias maps to `./src/*`.

```
src/
├── app/                  # App Router
│   ├── api/              # 19 REST route handlers (JSON { data | error } envelope)
│   └── [locale]/         # localized pages + layouts
│       ├── (app)/        # main shell: NavBar + BottomNav
│       ├── (admin)/      # admin shell: sidebar
│       └── (auth)/       # no shell (login)
├── components/           # UI, layout, map, protocol, providers, admin, community
├── hooks/                # useUserLocation
├── i18n/                 # routing/navigation/request + locales/{en,es}.json
├── lib/                  # auth, db, sync, validations, mappers, api helpers
├── services/             # healthCenters.ts, github.ts
├── types/                # profile, user, suggestion, github, map, next-auth
└── utils/                # geo.ts
proxy.ts                  # Next.js middleware (auth + locale + country cookie)
drizzle/                  # SQL migrations (0000..0009)
```

## Scripts

| Script | Command |
|---|---|
| `dev` | `next dev --turbo` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |
| `typecheck` | `tsc --noEmit` |
| `db:generate` | `drizzle-kit generate` |
| `db:migrate` | `drizzle-kit migrate` |
| `db:studio` | `drizzle-kit studio` |
| `test` / `test:run` | `vitest` / `vitest run` |
| `test:coverage` | `vitest run --coverage` |

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack dev, React Compiler) |
| Package manager | pnpm |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | NextAuth.js v4 (Google OAuth, JWT session) |
| i18n | next-intl (en/es) |
| Maps | Leaflet + react-leaflet |
| Offline | Dexie (read cache), IndexedDB (write outbox) |
| Validation | Zod |
| QR codes | `qrcode` |
| Tests | Vitest + Testing Library (jsdom) |
| Lint / typecheck | ESLint, `tsc --noEmit` |

## Database

Schema lives in `src/lib/db/schema.ts`; migrations in `drizzle/` (0000–0009).

Main tables:

- `users`, `account`, `session` — authentication and user roles (`viewer` / `rescuer` / `admin`)
- `profiles` — missing-person records (status, location, photo refs, verification, ownership)
- `photos` — uploaded photo blobs (base64)
- `profile_suggestions` — community-suggested updates to profiles
- `notifications` — per-user notifications
- `emergency_shelter` — emergency shelter records

Run `pnpm db:generate` after editing the schema, then `pnpm db:migrate` to apply.

## Security

- **CSP + security headers** are applied to every response via `next.config.ts` (`src/lib/security-headers.ts`). In dev, `unsafe-eval` is added for React/Turbopack debugging; production keeps a strict policy.
- **Photo ownership guards** (`src/lib/photo-guard.ts`) ensure users can only attach/delete photos they uploaded (or that they own, or as an admin).
- **Rate limiting** (`src/lib/rate-limit.ts`) trusts the proxy-appended IP for keying.
- **Admin routes/APIs** re-check the DB role server-side — the JWT role is not trusted alone.

## Deployment

Hosted on Vercel (Next.js 16). Set all environment variables from the table above
(`DATABASE_URL` should point at a hosted Postgres). The production build is:

```bash
pnpm build
```

PWA icons are served from `public/` and the app is installable.

## How to Contribute

1. **Fork** the repo and create a feature branch (`git checkout -b feature/my-change`).
2. Make your changes.
3. Keep the codebase healthy:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test:run
   ```
4. If you touch user-facing copy, update **both** locale files (`src/i18n/locales/en.json`
   and `es.json`) to keep them in sync.
5. Open a **pull request to `main`** with a clear description.

## License

Heroes is licensed under **CC BY-NC 4.0** — free to share and adapt for non-commercial
purposes with attribution; commercial use is not permitted. 

See [LICENSE](LICENSE).
