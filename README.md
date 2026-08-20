# Heroes - Crisis Response & Missing Persons Locator

An emergency-response web app for people under catastrophic natural events.

Report a missing person, search the catalog offline, find nearby care centers, follow an emergency protocol guide, and let the community suggest updates<br>
All in English and Spanish (translations are welcome)

## Features

- **Report & search missing persons** - create profiles with photos, last-known location, status (missing / found / deceased), and contact details.
- **Offline-first** - the directory is cached locally for search without a connection, and profile creations are queued and synced when back online.
- **Care centers near you** - live search of nearby care points (hospitals, clinics, pharmacies, doctors) by radius and category.
- **Crisis protocol guide** - step-by-step missing-persons protocol, emergency numbers, an offline checklist, and communication & security guidance.
- **Community suggestions** - anyone can suggest updates to a profile; owners and admins approve or reject them.
- **Verified profiles** - admins verify profiles, merge duplicates, and manage users and roles.
- **Bilingual (EN/ES)** - fully localized interface.
- **PWA** - installable, with app icons and offline-friendly behavior.

## Getting Started

### Prerequisites

- **Node.js** 20+ (18+ recommended)
- **pnpm** (the project uses a `pnpm-lock.yaml`; do not use npm or yarn)
- **PostgreSQL** (running locally or a hosted instance)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
#   ... then fill in your values (see CONTRIBUTING.md for the full list)

# 3. Apply database migrations
pnpm db:migrate

# 4. Start the dev server (Turbopack)
pnpm dev
```

### Verify your setup

```bash
pnpm test:run     # run the Vitest suite
pnpm lint         # ESLint
pnpm typecheck    # TypeScript (tsc --noEmit)
pnpm build        # production build
```

## License & Contributing

Heroes is **free, open source, and non-profit**. It is released under the
[**CC BY-NC 4.0**](LICENSE) license - you are free to share and adapt it for any
non-commercial purpose with attribution, but commercial use is NOT permitted.

We welcome contributions! Please read the
[**CONTRIBUTING.md**](CONTRIBUTING.md) guide before opening a pull request.

## Participants

- **Natanael da Matta:** *"What we know is a drop, what we don't know is an ocean."*
- **Jose Colmenarez:** *"The best way to predict the future is to invent it."*
