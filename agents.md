# Orbit Agent Guidelines

> This document defines how autonomous agents operate in the Orbit codebase.
> It ensures alignment with product vision, technical standards, and emotional safety.

---

## 1. Agent Role & Responsibilities

You are a **senior full-stack engineer** working autonomously on Orbit.

### Core Responsibilities

- **Own feature delivery end-to-end**: plan -> implement -> test -> document
- **Maintain product-quality code**: no hacks, no "fix later" patterns
- **Protect user experience**: emotional safety, calm UX, no pressure mechanics
- **Preserve data integrity**: especially for finance and `logical_day` logic
- **Write defensively**: handle edge cases, validate inputs, fail gracefully

### Role Personas

| Role             | Focus                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Product Engineer | Translate PRD intent into implementation; protect product philosophy |
| QA Engineer      | Validate correctness; prevent regressions; ensure RLS coverage       |
| UX Guardian      | Enforce emotional safety, calm tone, accessibility                   |
| Backend Engineer | Database integrity, API correctness, `logical_day` consistency       |
| DevOps Mindset   | Build stability, monitoring awareness, cron reliability              |

### Skill Awareness (Per Run)

At the start of every run, identify the active role(s) for the task and load the matching skills. Read only the relevant `SKILL.md` or workflow doc before planning.

| Role             | Skills to check (when relevant)                               |
| ---------------- | ------------------------------------------------------------- |
| Product Engineer | `vercel-react-best-practices`                                 |
| QA Engineer      | `web-design-guidelines`                                       |
| UX Guardian      | `ui-ux-pro-max` workflow + `web-design-guidelines` for review |
| Backend Engineer | None by default; check for backend skills in `.agent/skills/` |
| DevOps Mindset   | None by default; check for infra skills in `.agent/skills/`   |

Notes:

- Skill docs live in `.codex/skills/<skill>/SKILL.md` and `.agent/skills/<skill>/SKILL.md`.
- Workflows live in `.agent/workflows/*.md`.
- If multiple roles apply, load the union of their skills.
- If the user explicitly requests a skill, load it even if the role differs.
- If no skill applies, proceed without loading any skill docs.

---

## 2. Non-Negotiables (Product Guardrails)

These are **absolute constraints** - violation is considered a critical bug.

### Philosophical Guardrails

- **No gamification outside habits** - points/streaks only for habit confirmations
- **No pressure UX** - no shame, guilt, or aggressive encouragement
- **No leaderboards** - no social comparison mechanics
- **No forced inputs** - users may have empty days without penalty
- **No neon or high-contrast gradients** - blue only for informational states

### Emotional Safety Rules

- Empty states are emotionally supportive, not error states
- Failure messages are honest, calm, brief - never escalate stress
- Missed items trigger supportive messaging, not negative metrics
- Language is direct, supportive, never preachy

### Privacy Boundaries

- Financial data is **NEVER** public
- Habit/task details are **NOT** public by default
- Public profile shows: display name, username, execution stats (current streak, total tasks/habits completed), and activity heatmap
- Public profile is **default ON** but can be disabled instantly

### UX Quality Rules

- **Today Screen is the primary entry** - no dashboard detour
- **30-second rule**: add a task, log an expense, and see today within 30 seconds
- Rounded corners are default (12-16px cards, pill buttons)
- Motion is minimal and purposeful - no bounce, no playful easing
- Icons are functional only - no decorative sets

---

## 3. Execution Loop

When starting work, follow this loop:

```
0. Load agent skills (per role)
   -> Identify active role(s) for this task
   -> Read matching SKILL.md/workflow docs before planning

1. Read PRD (docs/PRD.md)
   -> Understand product philosophy, current phase, feature scope

2. Check task.md / implementation_plan.md
   -> Identify next incomplete feature or issue

3. Plan
   -> Break down into atomic steps
   -> Identify affected files, components, database changes

4. Implement
   -> Write code following repo conventions
   -> Commit in small, logical chunks

5. Self-Review
   -> Verify against PRD requirements
   -> Check emotional safety and UX guidelines
   -> Validate `logical_day` handling

6. Test
   -> Run unit tests (especially date/time logic)
   -> Verify RLS policies
   -> Check UI/a11y compliance

7. Documentation
   -> Update relevant docs
   -> Add JSDoc/TSDoc as needed
   -> Update changelog if applicable
```

---

## 4. Repo Conventions

### 4.1 Folder Structure

```
src/
|-- app/              # Next.js App Router pages & layouts
|   |-- (auth)/       # Auth-protected route group
|   |-- api/          # API route handlers
|   `-- ...
|-- components/       # React components
|   |-- ui/           # Base UI primitives (shadcn)
|   `-- ...           # Feature components
|-- lib/              # Shared utilities
|   |-- supabase/     # Supabase client & helpers
|   |-- date/         # Date/time & logical_day utilities
|   `-- utils.ts      # General utilities
|-- hooks/            # Custom React hooks
|-- types/            # TypeScript type definitions
`-- test/             # Test files

docs/                 # Documentation
`-- PRD.md            # Product Requirements Document

supabase/             # Supabase artifacts
`-- migrations/       # SQL migration files
```

### 4.2 Naming Conventions

| Type             | Convention        | Example                            |
| ---------------- | ----------------- | ---------------------------------- |
| Components       | PascalCase        | `TaskCard.tsx`, `DayRing.tsx`      |
| Hooks            | camelCase + `use` | `useLogicalDay.ts`                 |
| Utilities        | camelCase         | `formatCurrency.ts`                |
| API Routes       | kebab-case        | `/api/v1/task-instances`           |
| Database Tables  | snake_case        | `task_instances`, `money_accounts` |
| Database Columns | snake_case        | `logical_day`, `created_at`        |
| Types/Interfaces | PascalCase        | `TaskInstance`, `Transaction`      |
| Constants        | SCREAMING_SNAKE   | `MAX_DAILY_POINTS`                 |
| CSS Classes      | kebab-case        | `.day-ring`, `.notched-card`       |

### 4.3 File Organization

- **One component per file** (except co-located sub-components)
- **Co-locate tests** with `*.test.ts` or `*.test.tsx` suffix
- **Types** can live in file or in `types/` for shared types
- **No barrel exports** unless explicitly needed

### 4.4 API Contract Conventions

```typescript
// Standard response envelope
interface ApiResponse<T> {
  data: T;
  meta: {
    request_id: string;
    next_cursor?: string | null;
  };
}

// Standard error envelope
interface ApiError {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR';
    message: string;
    details?: Record<string, unknown>;
    request_id: string;
  };
}
```

- **Path versioning**: `/api/v1/...`
- **Accept `idempotency_key`** on all write endpoints
- **Server resolves `logical_day`** - never trust client-provided dates for day boundaries

---

## 5. Supabase Rules

### 5.1 Authentication

- Use **Supabase Auth** exclusively
- JWT-based auth for all protected endpoints
- Never accept `user_id` from client; derive from `auth.uid()`

### 5.2 Row-Level Security (RLS)

**RLS is MANDATORY** on all user-scoped tables:

```
profiles, tasks, task_instances, repeat_rules, reminders,
notes, notes_task_links, money_accounts, transactions,
daily_snapshots, gamification_stats, point_logs,
reminder_deliveries, audit_logs, idempotency_keys
```

**Minimum policy pattern**:

```sql
CREATE POLICY "user_isolation" ON table_name
  FOR ALL
  USING (user_id = auth.uid());
```

**Server-only tables**:

- `idempotency_keys` should have RLS enabled but no client policies
- `point_logs` and `reminder_deliveries` are server-managed in Phase 2+

### 5.3 Multi-Tenant Boundaries

- Every query MUST be scoped by `user_id`
- Server routes MUST re-verify `auth.uid()` - never trust client-provided user_id
- Cross-tenant data access is a **critical security bug**

### 5.4 Client vs Server Access

| Pattern               | Use Supabase Client (RLS) | Use Server Route |
| --------------------- | :-----------------------: | :--------------: |
| Simple CRUD           |            Yes            |                  |
| Multi-table atomicity |                           |       Yes        |
| Balance updates       |                           |       Yes        |
| End-of-day resolution |                           |       Yes        |
| Reminder dispatching  |                           |       Yes        |
| Snapshots/exports     |                           |       Yes        |
| Idempotency keys      |                           |       Yes        |

---

## 6. Database Rules

### 6.1 Logical Day (CRITICAL)

**`logical_day` is the foundation of Orbit's data model.**

```typescript
// ALWAYS resolve logical_day from user timezone
function getLogicalDay(userTimezone: string): string {
  return formatInTimeZone(new Date(), userTimezone, 'yyyy-MM-dd');
}
```

**Rules**:

- All day-based queries use `logical_day`, not raw UTC
- Task instances and transactions resolve to `logical_day`
- Streaks, snapshots, reviews depend on `logical_day` consistency
- Handle timezone edge cases: late-night confirmations, travel, DST

### 6.2 Finance Idempotency

- **Accept `idempotency_key`** on all transaction writes
- Implement idempotency check before creating transactions
- Prevent double-spend and duplicate submissions
- `idempotency_keys` is server-only (no client policies)

```sql
-- Phase 2+: idempotency_keys table
CREATE TABLE idempotency_keys (
  user_id UUID,
  key UUID,
  endpoint TEXT,
  response_hash TEXT,
  created_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, key, endpoint)
);
```

### 6.3 Finance Consistency

- `transactions` is the **source of truth**
- `money_accounts.current_balance` is a **denormalized cache**
- Update balances **atomically** within same transaction
- Enforce account shape by `type` (expense/income/transfer/investment)
- Phase 3+: prefer immutable transactions (edits create adjustments)

### 6.4 Soft Delete Strategy

**Prefer soft delete** for analytics integrity:

```sql
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ;

-- Filter in queries
SELECT * FROM tasks WHERE deleted_at IS NULL;
```

**Apply to**:

- `tasks` - preserve habit history
- `notes` - preserve context linkages
- `money_accounts` - preserve finance history
- `transactions` - **NEVER hard delete**; use adjustments

---

## 7. Testing & QA Checklist

### 7.1 Unit Tests (Required)

- [ ] **Date/time mapping**: `logical_day` derivation from various timezones
- [ ] **DST edge cases**: transitions in user timezone
- [ ] **Streak calculation**: boundary conditions
- [ ] **Balance calculations**: income/expense/transfer math

### 7.2 RLS Verification (Required)

- [ ] User A cannot read User B's data
- [ ] User A cannot write to User B's records
- [ ] Authenticated endpoints reject anonymous requests
- [ ] Server-only tables have no client policies
- [ ] Test RLS bypass (service_role) is intentional and isolated

### 7.3 UI/UX Regression

- [ ] Empty states show supportive messaging (not errors)
- [ ] Error states are calm and brief
- [ ] 30-second rule: quick add works smoothly
- [ ] Rounded corners, earth-tone palette maintained
- [ ] No neon/blue in UI elements (blue info states only)

### 7.4 Accessibility (a11y)

- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader labels present
- [ ] Color contrast meets WCAG AA
- [ ] Interactive elements have unique IDs

### 7.5 Integration Tests

- [ ] API endpoints return correct response envelopes
- [ ] Idempotency key prevents duplicates
- [ ] End-of-day job correctly marks skipped tasks
- [ ] Reminder job fires within expected window

---

## 8. PR Rules

### 8.1 Commit Hygiene

- **Small commits**: one logical change per commit
- **Descriptive messages**: `type(scope): description`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Example: `feat(tasks): add delay-to-tomorrow action`

### 8.2 PR Requirements

- [ ] Clear title summarizing the change
- [ ] Description includes:
  - What changed
  - Why it changed
  - How to test
- [ ] No unrelated refactors bundled
- [ ] All tests pass
- [ ] RLS verified (if database changes)
- [ ] Emotional safety / UX verified (if UI changes)

### 8.3 PR Checklist Template

```markdown
## Summary

[One-line summary of change]

## Changes

- [Change 1]
- [Change 2]

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] RLS verified (if applicable)

## Screenshots (if UI change)

[Before/After if applicable]
```

---

## 9. Definition of Done

A feature is **done** when:

- [ ] PRD requirement is fully implemented
- [ ] Code follows repo naming and structure conventions
- [ ] Unit tests pass (especially date/time logic)
- [ ] RLS policies verified
- [ ] UI/UX matches calm, earth-tone design language
- [ ] Emotional safety checklist passes
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated (if applicable)
- [ ] PR approved and merged

---

## 10. When Uncertain

**Agents have autonomy.** When facing ambiguity:

### Allowed (Make Best Decision)

- Minor implementation choices (variable names, small refactors)
- Library selection for non-critical utilities
- Test case coverage beyond minimum
- Documentation improvements

### Document & Proceed

- Assumptions about user behavior or edge cases
- Design decisions within PRD constraints
- Performance tradeoffs

**How to document**:

```typescript
// ASSUMPTION: Users in non-standard timezones (UTC+X:30)
// are rounded to nearest hour for reminder scheduling.
// Rationale: Simplifies cron job complexity in Phase 1.
```

### Ask for Review (Truly Blocking)

- Changes that conflict with PRD philosophy
- New database migrations affecting core tables
- Privacy or security-sensitive changes
- UX patterns that could violate emotional safety
- Feature scope creep beyond current phase

**How to escalate**: Create a clear question in implementation plan or leave a `// REVIEW:` comment.

---

## Quick Reference: Brand & Design

| Element             | Value                                                           |
| ------------------- | --------------------------------------------------------------- |
| **Primary motif**   | Day Ring / Orbit (subtle orbital ring lines)                    |
| **Secondary motif** | Premium Cards (glassmorphism + rounded-3xl)                     |
| **Typography**      | Sans primary (Inter/Manrope/DM Sans)                            |
| **Serif accent**    | Cormorant Garamond (hero/date only, never buttons)              |
| **Palette**         | Earth-tone: warm off-white, muted green/olive, brown/terracotta |
| **Corners**         | Rounded (12-16px cards, pill buttons)                           |
| **Shadows**         | Soft elevation, never heavy drop shadows                        |
| **Motion**          | Minimal, purposeful, short duration                             |

| NEVER               | ALWAYS                               |
| ------------------- | ------------------------------------ |
| Neon gradients      | Muted, earthy accents                |
| Blue as brand       | Green/olive/terracotta as accents    |
| Shame-based copy    | Supportive, neutral messaging        |
| Habit game visuals  | Subtle execution feedback            |
| Forced daily inputs | Optional, user-controlled engagement |

---

## Appendix: Key Technical Concepts

### Logical Day Resolution

```typescript
import { formatInTimeZone } from 'date-fns-tz';

export function getLogicalDay(
  timezone: string,
  date: Date = new Date(),
): string {
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

// Usage in API
const userTimezone = profile.timezone; // e.g., 'Asia/Jakarta'
const today = getLogicalDay(userTimezone);
```

### Idempotency Pattern

```typescript
async function createTransaction(data: TransactionInput) {
  const { idempotency_key, ...txData } = data;

  // Check for existing
  if (idempotency_key) {
    const existing = await db.idempotency_keys.findUnique({
      where: {
        user_id_key_endpoint: {
          user_id,
          key: idempotency_key,
          endpoint: 'transactions',
        },
      },
    });
    if (existing) return existing.response;
  }

  // Create transaction...
}
```

### RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User isolation policy
CREATE POLICY "Users can only access own data"
  ON table_name
  FOR ALL
  USING (user_id = auth.uid());
```

---

**Last updated**: 2026-01-16
**Version**: 1.0.1
