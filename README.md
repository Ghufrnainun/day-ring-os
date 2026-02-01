# Orbit

**Run your day calmly.**

Orbit is a planner-centric Life and Finance OS designed to help users manage their daily tasks, habits, and finances in a calm, non-judgmental environment. The Today Screen serves as the single daily control center where everything converges: tasks, habits, and money movements for the current logical day.

## 📖 Table of Contents

- [Overview](#overview)
- [Philosophy & Design Principles](#philosophy--design-principles)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Getting Started](#getting-started)
- [Development Guide](#development-guide)
- [Key Concepts](#key-concepts)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Overview

Orbit is a **Life Execution System**, not just a tracker app. It prioritizes **daily execution clarity** over public performance metrics. The product positions the day as the primary unit of execution, with control achieved through rhythm and structure rather than pressure or optimization.

### What Orbit Is

- **Daily Planner (Core)**: Manage tasks, habits, and daily execution
- **Habit & Reminder Engine**: Build sustainable routines with repeat rules and confirmations
- **Multi-Account Finance System**: Track money flows across accounts with budget planning
- **Context System**: Notes and checklists that support planning and execution
- **Gamification Layer** (Habits Only): Optional points and streaks for habit formation

### What Orbit Is NOT

- Not a habit game with social leaderboards
- Not a productivity tracker focused on metrics and KPIs
- Not a financial advisor or investment platform
- Not a social network or comparison platform

---

## Philosophy & Design Principles

### Product Guardrails (Non-Negotiable)

These are absolute constraints that define Orbit's identity:

- **No Pressure UX**: No shame, guilt, or aggressive encouragement
- **No Leaderboards**: No social comparison mechanics
- **No Gamification Outside Habits**: Points and streaks only for habit confirmations
- **No Neon or High-Contrast Gradients**: Earth-tone palette with calm aesthetics
- **No Forced Inputs**: Users may have empty days without penalty

### Emotional Safety Rules

- Empty states show supportive messaging, not error states
- Failure messages are honest, calm, and brief—never escalate stress
- Missed items trigger supportive messaging, not negative metrics
- Language is direct and supportive, never preachy

### Privacy Boundaries

- **Financial data is NEVER public**
- Habit/task details are NOT public by default
- Public profile shows execution heatmap only
- Public profile is default ON but can be disabled instantly

### UX Quality Rules

- **Today Screen is the primary entry**—no dashboard detour
- **30-second rule**: Add a task, log an expense, and see today within 30 seconds
- Rounded corners are default (12-16px cards, pill buttons)
- Motion is minimal and purposeful—no bounce, no playful easing
- Icons are functional only—no decorative sets

---

## Core Features

### 1. Today Screen (Main Entry)

The Today Screen is the **single daily control center** where users can:

- View all tasks and habits for the current logical day
- Quick add tasks, habits, or financial transactions
- Update task status (done, skipped, delayed)
- See lightweight daily summaries (tasks completed, habit streaks, money moved)
- Apply quick filters (all, pending, done, skipped, habits-only)

### 2. Tasks & Task Management

- **One-off tasks**: Single execution items with optional scheduling
- **Scheduled tasks**: Tasks assigned to specific dates and times
- **Task status tracking**: Pending, done, skipped, delayed
- **Task instances**: Daily execution records tied to logical days
- **Task linking**: Connect tasks to notes for context

### 3. Habits & Repeat Engine

Habits are **repeatable tasks** with special characteristics:

- **Repeat rules**: Daily, weekly, or custom schedules
- **Reminder system**: Email or push notifications (best-effort)
- **Auto-expiration**: Unconfirmed habits auto-mark as "not completed today"
- **Streak tracking**: Per-day streaks when at least one habit is completed
- **Points system**: Earn points ONLY from habit completion (not one-off tasks)
- **Habit-only gamification**: Levels and achievements from long-term consistency

### 4. Finance & Money Management

Multi-account finance system with focus on flows:

- **Multiple account types**: Bank/savings, cash, e-wallet, investment
- **Multi-currency support**: Each account has a currency code; no auto-conversion
- **Transaction types**:
  - **Income**: Choose destination account, balance increases
  - **Expense**: Choose source account, balance decreases
  - **Transfer/Investment**: Choose from + to accounts (Phase 2+)
- **Auto-balance updates**: Account balances update automatically with transactions
- **Transaction categories**: User-defined with seeded defaults
- **Receipt attachments**: Optional upload (OCR in Phase 3+)
- **Subscription tracking** (Phase 2+): Track recurring charges with gentle reminders
- **Budget caps** (Phase 2+): Optional soft caps per category with calm warnings
- **Negative balance allowed**: Soft warnings, no hard blocks

### 5. Notes & Context System

Notes provide **context**, not execution:

- Rich text editor with checklist support
- Convert checklist items into actionable tasks
- Link notes to tasks and transactions
- Notes are time-independent, providing persistent context
- Not bound to single days—remain as reference material

### 6. Reviews & Analytics (Phase 2+)

- Weekly and monthly rollups
- Task completion trends
- Habit consistency tracking
- Finance overview and insights
- Historical comparisons
- AI-assisted summaries (Phase 3+, optional)

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, shadcn-ui components |
| **UI Components** | Radix UI primitives |
| **Editor** | TipTap (rich text) |
| **State Management** | React Query (TanStack Query) |
| **Authentication** | Supabase Auth (JWT-based) |
| **Database** | Supabase (PostgreSQL) |
| **Date/Time** | date-fns, date-fns-tz |
| **Forms** | React Hook Form, Zod validation |
| **Testing** | Vitest, Testing Library |

### Architecture Patterns

#### 1. Logical Day Concept (CRITICAL)

All activities are mapped to a **logical_day (DATE)** derived from the user's timezone:

```typescript
// Always resolve logical_day from user timezone
function getLogicalDay(userTimezone: string): string {
  return formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
}
```

**Rules:**
- `logical_day` is calculated from user timezone, not raw UTC
- Tasks, habits, reminders, and transactions resolve to logical days
- Streaks, snapshots, and analytics rely on logical_day consistency
- Timezone changes apply forward-only; historical values are not recomputed

#### 2. Multi-Tenant Security (RLS)

**Row-Level Security (RLS) is MANDATORY** on all user-scoped tables:

```sql
CREATE POLICY "user_isolation" ON table_name
  FOR ALL
  USING (user_id = auth.uid());
```

- Every query is scoped by `user_id`
- Server routes re-verify `auth.uid()`—never trust client-provided user_id
- Cross-tenant data access is a critical security bug

#### 3. Finance Idempotency

```typescript
// Accept idempotency_key on all transaction writes
async function createTransaction(data: TransactionInput) {
  const { idempotency_key, ...txData } = data;
  // Check for existing transaction with same key
  // Prevents double-spend and duplicate submissions
}
```

- `transactions` table is the source of truth
- `money_accounts.current_balance` is a denormalized cache
- Balances update atomically within same transaction
- `idempotency_keys` table is server-only (no client policies)

### Database Schema

#### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User settings, timezone, active modules |
| `tasks` | Task definitions (one-off or templates) |
| `task_instances` | Daily execution records per logical_day |
| `repeat_rules` | Habit repeat patterns (daily, weekly, custom) |
| `reminders` | Scheduled notifications (email, push) |
| `notes` | Rich text context with checklist support |
| `notes_task_links` | Connections between notes and tasks |
| `money_accounts` | Financial accounts with balances |
| `transactions` | Money flows (income, expense, transfer, investment) |
| `gamification_stats` | Aggregated points, streaks, levels |
| `daily_snapshots` | End-of-day rollups (Phase 2+) |
| `idempotency_keys` | Server-only duplicate prevention |

#### Key Indexes

- `idx_task_instances_logical_day`: Fast day-based queries
- `idx_task_instances_user_logical_day`: User-scoped day queries
- `idx_transactions_logical_day`: Financial day queries

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, pnpm, or bun
- Supabase CLI (for local development)

### Installation

1. **Clone the repository**

```bash
# Note: Repository name is 'day-ring-os', product name is 'Orbit'
git clone https://github.com/Ghufrnainun/day-ring-os.git
cd day-ring-os
```

2. **Install dependencies**

```bash
npm install
# or
bun install
```

3. **Set up environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server**

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Database Setup

If you need the database locally with Supabase:

```bash
# Start Supabase locally
npx supabase start

# Reset database and apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > src/types/supabase.ts
```

---

## Development Guide

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |

### Folder Structure

```
src/
├── app/                # Next.js App Router pages & layouts
│   ├── (auth)/         # Auth-protected route group
│   ├── (dashboard)/    # Dashboard route group
│   ├── api/            # API route handlers
│   └── ...
├── components/         # React components
│   ├── ui/             # Base UI primitives (shadcn)
│   ├── dashboard/      # Dashboard-specific components
│   ├── auth/           # Authentication components
│   └── ...
├── lib/                # Shared utilities
│   ├── supabase/       # Supabase client & helpers
│   ├── logic/          # Business logic utilities
│   ├── api/            # API client utilities
│   └── ...
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── actions/            # Server actions
└── test/               # Test files

docs/                   # Documentation
├── PRD.md              # Product Requirements Document
└── ...

supabase/               # Supabase artifacts
├── migrations/         # SQL migration files
├── config.toml         # Supabase configuration
└── ...
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TaskCard.tsx`, `DayRing.tsx` |
| Hooks | camelCase + `use` | `useLogicalDay.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| API Routes | kebab-case | `/api/v1/task-instances` |
| Database Tables | snake_case | `task_instances`, `money_accounts` |
| Database Columns | snake_case | `logical_day`, `created_at` |
| Types/Interfaces | PascalCase | `TaskInstance`, `Transaction` |
| Constants | SCREAMING_SNAKE | `MAX_DAILY_POINTS` |
| CSS Classes | kebab-case | `.day-ring`, `.notched-card` |

### API Conventions

**Standard Response Envelope:**

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string;
    next_cursor?: string | null;
  };
}
```

**Standard Error Envelope:**

```typescript
interface ApiError {
  error: {
    code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED' | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
  };
}
```

**Rules:**
- Path versioning: `/api/v1/...`
- Accept `idempotency_key` on all write endpoints
- Server resolves `logical_day`—never trust client-provided dates

### Testing Strategy

#### Unit Tests (Required)

- Date/time mapping: `logical_day` derivation from various timezones
- DST edge cases: transitions in user timezone
- Streak calculation: boundary conditions
- Balance calculations: income/expense/transfer math

#### RLS Verification (Required)

- User A cannot read User B's data
- User A cannot write to User B's records
- Authenticated endpoints reject anonymous requests
- Server-only tables have no client policies

#### UI/UX Regression

- Empty states show supportive messaging (not errors)
- Error states are calm and brief
- 30-second rule: quick add works smoothly
- Rounded corners, earth-tone palette maintained

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js and React rules
- **Testing**: Vitest for unit tests
- **Accessibility**: WCAG AA compliance target

---

## Key Concepts

### Logical Day

The foundation of Orbit's data model. All day-based queries use `logical_day` instead of raw UTC timestamps.

**Critical Rules:**
- Derived from user's timezone setting
- Tasks, habits, and transactions map to logical days
- Handles timezone edge cases: late-night confirmations, travel, DST
- Timezone changes apply forward-only

### Habits vs Tasks

Both stored in the `tasks` table, differentiated by UX and behavior:

- **Tasks**: One-off or irregular work (meetings, assignments, errands)
- **Habits**: Recurring behavior with repeat rules (reading, workouts)
- Habits have auto-enable repeat rules and require confirmation
- Only habits earn gamification points

### Transaction Flows

Transactions are **flows between accounts**, not isolated records:

- **Income**: External → Account (balance increases)
- **Expense**: Account → External (balance decreases)
- **Transfer**: Account A → Account B (both balances update)
- **Investment**: Account → Investment Account (specialized transfer)

### Soft Delete Strategy

Preserve analytics and history integrity:

```sql
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;
-- Filter in queries
SELECT * FROM tasks WHERE deleted_at IS NULL;
```

Applied to: `tasks`, `notes`, `money_accounts`, and especially `transactions`

---

## Project Structure

### Application Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page / Today Screen (authenticated) |
| `/auth/*` | Authentication flows (sign in, sign up) |
| `/onboarding` | Initial setup and module selection |
| `/(dashboard)/*` | Main application screens |
| `/(dashboard)/today` | Today Screen (primary entry) |
| `/(dashboard)/tasks` | Task management |
| `/(dashboard)/habits` | Habit management |
| `/(dashboard)/finance` | Finance dashboard |
| `/(dashboard)/notes` | Notes and context |
| `/api/v1/*` | RESTful API endpoints |
| `/u/[username]` | Public profile (execution heatmap) |

### Component Architecture

- **UI Primitives** (`components/ui/`): Radix-based shadcn components
- **Feature Components** (`components/dashboard/`): Business logic components
- **Layout Components**: Consistent navigation and structure
- **Form Components**: React Hook Form + Zod validation

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[docs/PRD.md](docs/PRD.md)**: Complete Product Requirements Document
  - Product positioning and philosophy
  - Feature scope and phasing
  - User flows and interactions
  - UX rules and design guidelines
  - Data model and schema decisions

- **[agents.md](agents.md)**: Development Guidelines
  - Agent roles and responsibilities
  - Coding standards and conventions
  - Database rules and patterns
  - Testing and QA checklist
  - Definition of done

- **Migration Files** (`supabase/migrations/`): Database schema evolution
  - `20260115000000_init_schema.sql`: Initial schema
  - `20260116000000_finance_triggers.sql`: Finance automation
  - `20260117000000_finance_multi_currency.sql`: Multi-currency support
  - And more...

---

## Contributing

### Development Workflow

1. Read `docs/PRD.md` to understand product philosophy
2. Check `agents.md` for coding standards
3. Create a feature branch from `main`
4. Follow naming conventions and folder structure
5. Write tests for new features
6. Verify RLS policies for database changes
7. Ensure emotional safety and UX guidelines are met
8. Submit PR with clear description and testing notes

### PR Requirements

- Clear title summarizing the change
- Description includes: what changed, why, how to test
- No unrelated refactors bundled
- All tests pass
- RLS verified (if database changes)
- Emotional safety / UX verified (if UI changes)

### Definition of Done

A feature is done when:

- PRD requirement is fully implemented
- Code follows repo conventions
- Unit tests pass (especially date/time logic)
- RLS policies verified
- UI/UX matches calm, earth-tone design language
- Emotional safety checklist passes
- No TypeScript errors or ESLint warnings
- Documentation updated
- PR approved and merged

---

## License

This project is private and proprietary.

---

## Contact

For questions or feedback about Orbit, please contact the repository maintainer.

---

**Built with care to help you run your day calmly.** 🌍✨
