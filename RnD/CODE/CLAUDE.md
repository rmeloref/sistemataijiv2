# Sistema Taiji

Commercial web application being built to sell to Chinese medicine clinics. This is an active product, not an experiment — prefer conservative changes, preserve working behavior, and ask before touching auth, billing, or patient-data paths.

## Stack

- Next.js (App Router) — see AGENTS.md below for breaking-change warnings
- Supabase (auth + database, see `supabase/`)
- TypeScript, Tailwind, shadcn/ui (`components.json`)
- Env config in `.env.local` (not committed)

## Layout

- `app/` — Next.js routes and pages
- `components/` — shared UI components
- `lib/` — utilities, Supabase client, helpers
- `supabase/` — migrations, edge functions, local config
- `proxy.ts` — local dev proxy (check before changing dev workflow)

## Historical note

There is an older version of this project archived at `../_arquivo/sistemataiji-old/` (Vite/React + Bun). The current version is a rewrite on Next.js. Don't copy patterns from the old one without checking whether they still apply.

@AGENTS.md
