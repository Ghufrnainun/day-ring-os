# Orbit

Run your day calmly.

Orbit is a planner-centric Life and Finance OS. The Today Screen is the single daily
control center. Habits are repeatable tasks, and money moves are flows between accounts.

## What it includes

- Today Screen: tasks, habits, and money moved for the current logical day
- Tasks: one-off or scheduled items with status (done, skipped, delayed)
- Habits: repeat rules, confirmations, and optional points
- Notes: context that can convert checklist items into tasks
- Finance: multi-account flows (income, expense, transfer, investment)
- Reviews: weekly/monthly rollups (Phase 2+)

## Product guardrails

- No pressure UX, no shame, no guilt
- No leaderboards or social comparison
- No gamification outside habits
- No neon or high-contrast gradients
- Earth-tone palette and calm tone

See `docs/PRD.md` for full product scope and UX rules.

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn-ui
- Supabase

## Quickstart

```sh
npm install
npm run dev
```

If you need the database locally:

```sh
npx supabase start
npx supabase db reset
```

## Key concepts

- `logical_day` drives all day-based queries. It is derived from the user's timezone.
- `transactions` are the source of truth for finance.
- `idempotency_keys` is server-only to prevent duplicate writes.

## Repo pointers

- `docs/PRD.md` for product requirements and UX rules
- `agents.md` for coding standards and guardrails
- `supabase/migrations` for schema changes
