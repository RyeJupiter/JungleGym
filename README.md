# JungleGym 🌿

A **distributed personal training platform** where **minds are in motion** as much as bodies. JungleGym connects learners with vetted movement teachers — built as a Turborepo monorepo.

## Apps & Packages

| Path | Description |
|---|---|
| `apps/web` | Next.js 14 web app (App Router + Tailwind CSS) |
| `apps/mobile` | React Native + Expo mobile app (Expo Router) |
| `packages/shared` | Shared TypeScript types, Supabase client, and utilities |

## Tech Stack

- **Monorepo**: [Turborepo](https://turbo.build) + Yarn Workspaces
- **Web**: Next.js 14, Tailwind CSS, `@supabase/auth-helpers-nextjs`
- **Mobile**: React Native, Expo SDK 51, Expo Router
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS)
- **Language**: TypeScript throughout

## Data Model

### User Roles
- **Trainer** — profile fields: `name`, `photo`, `bio`, `location`, `specialties[]`, `certifications[]`, `years_experience`, `hourly_rate`, `availability`
- **Client** — profile fields: `name`, `photo`, `bio`, `location`, `goals[]`, `fitness_level`, `preferred_training_style[]`, `medical_notes`

### Tables
- `users` — mirrors `auth.users` with role
- `profiles` — unified profile table (role-specific fields nullable)
- `training_sessions` — session booking with status lifecycle
- `session_reviews` — post-session ratings (1–5) + comments

## Getting Started

### Prerequisites
- Node.js >= 18
- Yarn 4
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 1. Install dependencies
```bash
yarn install
```

### 2. Set up Supabase locally
```bash
supabase start
supabase db reset   # applies migrations + seed data
```

### 3. Configure environment variables

**Web** — copy `apps/web/.env.example` to `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

**Mobile** — copy `apps/mobile/.env.example` to `apps/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 4. Run dev servers
```bash
yarn dev          # all apps in parallel via Turbo
# or individually:
yarn workspace @junglegym/web dev
yarn workspace @junglegym/mobile dev
```

## Supabase Migrations

Migrations live in `supabase/migrations/`:

| File | Description |
|---|---|
| `00001_initial_schema.sql` | Core tables, enums, indexes, triggers |
| `00002_rls_policies.sql` | Row Level Security for all tables |
| `00003_storage.sql` | Profile photos storage bucket + policies |

## Project Structure

```
JungleGym/
├── apps/
│   ├── web/                    # Next.js 14
│   │   └── src/
│   │       ├── app/            # App Router pages
│   │       ├── components/     # React components
│   │       └── lib/supabase/   # Supabase helpers
│   └── mobile/                 # Expo
│       ├── app/                # Expo Router screens
│       └── src/
│           ├── context/        # React context (auth)
│           └── lib/            # Supabase client
├── packages/
│   └── shared/                 # Shared code
│       └── src/
│           ├── types/          # TypeScript types
│           ├── supabase/       # DB types + client factory
│           └── utils/          # Shared utilities
└── supabase/
    ├── migrations/             # SQL migrations
    ├── seed.sql                # Dev seed data
    └── config.toml             # Supabase local config
```
