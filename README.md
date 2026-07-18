# Heroes Project


## 🛠 Tech Stack & Ecosystem

*   **Framework:** Next.js 15 (App Router - Hybrid Client/Server Architecture)
*   **Package Manager:** `pnpm` (Optimized performance and resource allocation)
*   **Build Tool / Compiler:** Turbopack (`next dev --turbo`)
*   **Styling:** Tailwind CSS
*   **Database ORM:** Drizzle ORM (PostgreSQL dialect)
*   **Authentication:** NextAuth.js v4 (LTS Stable Integration)
*   **Deployment Platform:** Vercel

---

## 📁 Project Structure & Alias Mapping

The project enforces a highly structured, scalable directory tree located inside the `src/` directory.

### Path Alias Configuration
To maintain clean, absolute imports across the codebase, a global path alias is strictly mapped in `tsconfig.json`. The standard `@/` prefix is explicitly tied to the root of the source folder:

*   **`@/*`** maps directly to **`./src/*`**

### Folder Directory Conventions
```text
src/
├── app/                  # File-system Routing (App Router)
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts  # NextAuth v4 Route Handlers
│   ├── layout.tsx
│   └── page.tsx
├── components/           # Reusable UI components (Atomic/Molecular)
├── lib/                  # Infrastructure, database clients, and core services
│   ├── auth.ts           # NextAuth execution configuration options
│   └── db/
│       ├── client.ts     # Singleton database client instance
│       └── schema.ts     # Strongly typed relational database schemas
├── styles/               # Global styles and Tailwind entrypoints
└── types/                # Global type definitions (No 'any' allowed)
```

---

## ⚙️ Environment Variables Setup

The repository ships with an environment variable blueprint to guarantee reproducible deployments across local and cloud pipelines. 

### How to configure:
1. Copy the template file to create your local runtime configuration:
   ```bash
   cp .env.example .env
   ```
2. Open the newly created `.env` file and populate it with your local credentials:
   *   `DATABASE_URL`: Your secure PostgreSQL connection string.
   *   `NEXTAUTH_SECRET`: A secure, cryptographically random string (minimum 32 characters) used to encrypt session tokens.
   *   `NEXTAUTH_URL`: The canonical base URL of your application (e.g., `http://localhost:3000` during development).

*Note: The `.env` file is explicitly blocked in `.gitignore` to prevent any structural credential leaks.*

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run the Local Development Environment (with Turbopack)
```bash
pnpm dev
```

### 3. Database Management Operations
```bash
# Generate relational migrations based on the schema definitions
pnpm db:generate

# Push schema states safely directly to the database instance
pnpm db:push
```

---

## 👥 Participants

*   **Natanael da Matta:** *_"What we know is a drop, what we don't know is an ocean."_*
*   **Jose Colmenarez:** *_“The best way to predict the future is to invent it.”_*
