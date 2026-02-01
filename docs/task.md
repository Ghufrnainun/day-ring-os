# Orbit - Implementation Tasks

> **Status:** aligned with PRD v1.1 (2026-01-15)
> **Scope:** Phase 1 MVP + Phase 2-4 backlog labeled (P2+ / P3+ / P4+)

## 1. Foundations & Guardrails (PRD 2, 6)

- [x] Today Screen is primary entry (no dashboard detour) ✅ (redirects to /today)
- [x] Enforce "no gamification outside habits" across UI + backend ✅ (points only for habits)
- [x] Emotional safety copy rules (empty/error/undo states) ✅ (EmptyState + calm toasts)
- [x] Visual guardrails: earth tones, blue info only, rounded corners, minimal motion ✅
- [x] 30-second rule validation (add task, log expense/income, see Today) ✅ (QuickAdd + QuickFinance)

## 2. Core Architecture & Standards

- [x] **Project Scaffolding**
  - [x] Next.js 14+ App Router Setup
  - [x] TailwindCSS + ShadcnUI Configuration (Earth Tones)
  - [x] Font Setup (Inter/Sans)
  - [x] `mcp_config.json` setup
- [ ] **API Contract Conventions**
  - [ ] Standard response envelope (`data`, `meta`)
  - [ ] Standard error envelope with codes
  - [ ] Path versioning (`/api/v1`)
  - [x] `request_id` generation + logging
  - [x] Idempotency required on all write endpoints (Finance done)

## 3. Database & Supabase (PRD 6, 9, 10)

- [x] **Database & Schema (Supabase)**
  - [x] Initial Schema Migration
  - [x] `tasks` and `task_instances` tables
  - [x] `finance` tables (`money_accounts`, `transactions`)
- [x] **Core Tables Existence Check**
  - [x] `profiles` (schema updated v1.1)
  - [x] `repeat_rules`
  - [x] `reminders`
  - [x] `notes`
  - [x] `notes_task_links`
  - [x] `daily_snapshots`
  - [x] `gamification_stats`
  - [x] `audit_logs`
  - [x] `idempotency_keys`
  - [x] `point_logs`
  - [x] `reminder_deliveries`
- [x] **Schema Refinements (PRD v1.1)**
  - [x] Add `deleted_at` for soft delete (`tasks`, `notes`, `money_accounts`)
  - [x] Enforce "no hard delete" for `transactions` (use adjustments, P3+)
  - [x] Finance account type constraints (`bank`, `cash`, `ewallet`, `investment`)
- [x] **Logical Day Enforcement**
  - [x] Central `getLogicalDate` utility (timezone-based) ✅ (in date-utils.ts)
  - [x] All day-based writes resolve `logical_day` on server ✅ (finance, reviews, instances)
- [x] **Security & RLS (Critical)**
  - [x] Basic RLS enabled ✅
  - [ ] Audit RLS policies across all user-scoped tables (P2+)
  - [ ] Server-only policies for `idempotency_keys`, `point_logs`, `reminder_deliveries` (P2+)
  - [ ] Service-role `ensure_instances` engine (restricted) (P2+)

## 4. Authentication & Onboarding (PRD 4.1)

- [x] **Supabase Auth Integration**
  - [x] Login / Register Pages
  - [x] Middleware protection
  - [x] Email Templates (Branded Orbit Style)
- [x] **Onboarding Flow**
  - [x] Timezone detection & storage in `profiles`
  - [x] Module selection (Planner / Habits / Finance) defaults
  - [x] Public profile default ON with instant toggle
  - [x] Land on Today Screen immediately (no dashboard detour)
- [x] **Navigation & Activation**
  - [x] Global `+ Add` button (Fab/Shortcut) -> Task, Habit, Note, Transaction
  - [x] Bottom Dock / Sidebar logic refined
  - [x] Settings Page (Profile, Timezone)
  - [x] Landing Page (Components verification)

## 5. Navigation & Global Add (PRD 6.4, 6.5)

- [x] Navigation structure: Today, Notes (Server Component), Finance, Settings
- [x] No separate Habits page in primary nav ✅ (Habits in nav but Today is primary)
- [x] **Global `+ Add` sheet** ✅
  - [x] Add Task ✅
  - [x] Add Habit ✅
  - [x] Add Note ✅
  - [x] Add Transaction ✅
- [x] **Sheet accessibility (PRD 6.5.1)** ✅ NEW
  - [x] Focus trap and return focus
  - [x] ESC closes, Enter submits when valid
  - [x] Tab order matches layout
  - [x] `aria-label` on icon-only actions
  - [x] Skip-to-content link on nav-heavy screens
- [x] **Add flow constraints** ✅
  - [x] Sheets for multi-field forms, popovers only for small controls ✅
  - [x] Modals reserved for confirmations and destructive actions ✅

## 6. Today Screen & Task Execution (PRD 4.2, 6.10, 6.15, 6.16)

- [x] **Today Screen Layout**
  - [x] Header & Date Navigation
  - [x] Task List Rendering
  - [x] Summary panel (tasks done, habits done, money in/out)
- [x] **Quick add within 30-second rule** ✅ NEW
- [x] **Status toggles: pending / done / skipped / delayed** ✅ NEW
- [x] **Undo/recovery toast (8s) for status changes** ✅ NEW
- [x] **Empty state copy (calm, supportive)** ✅ NEW
- [x] **Loading states (skeleton loaders)** ✅ NEW
- [x] **Optimistic updates with calm error fallback** ✅ NEW
- [x] **Quick log finance from Today** ✅ NEW
- [x] **Allow past-day quick logging for finance** ✅ NEW
- [ ] Quick filters (All / Pending / Done / Skipped, Habits only) (P2+)

## 7. Tasks & Habits Engine (PRD 5.1, 5.2, 6.6)

- [x] `ensure_instances` logic for day generation
- [x] **Add Task Sheet** (PRD 6.5) - Accessible, keyboard navigable
- [x] Add Habit flow (repeat rule + reminder required by default)
- [x] **Auto-expire unconfirmed habits to "skipped" (end-of-day job)** ✅ NEW
- [x] **Delayed tasks move to next logical day** ✅ NEW
- [x] Task vs Habit visual distinction (gentle, non-pressure)
- [x] **Habit confirmation required (manual) for points** ✅ (Points only awarded on Done click)
- [ ] Repeat rule helpers (weekday/weekend presets, exclude days) (P2+)

## 8. Reminders (PRD 5.2, 10.7)

- [x] **Reminder CRUD in Settings** ✅ NEW
- [x] **Email delivery (Phase 1)** ✅ NEW (API route ready, needs Resend setup)
- [x] `/api/v1/system/reminders/run` windowed dispatch ✅ NEW
- [ ] Best-effort delivery behavior (no alarm-grade promises)
- [ ] Delivery logging + retry strategy (P2+)

## 9. Gamification (PRD 5.3)

- [x] **Points awarded only for habit completion (not one-off tasks)** ✅ NEW
- [x] **Daily point cap (100 pts)** ✅ NEW
- [x] **Streak logic (per-day based on any habit completion)** ✅ NEW
- [x] **`gamification_stats` updates on completion** ✅ NEW
- [ ] `point_logs` audit trail (P2+)
- [ ] Achievements + levels derived from long-term consistency (P2+)

## 10. Notes & Board View (PRD 5.5, 6.21)

- [x] **Notes Editor**
  - [x] Rich Text / Markdown support
  - [x] Checklist support
  - [ ] Note attachments (images/files, lightweight) (P2+)
  - [x] **Convert checklist item -> Task** ✅ NEW
- [x] Templates: blank, meeting, weekly, billing, project
- [x] **Link Notes ↔ Tasks ↔ Transactions** ✅ NEW
- [x] **Board View inside Notes (P2+)** - Kanban-style board ✅ NEW
  - [x] Kanban columns (Getting Started, Features, Tips, etc.) ✅
  - [x] Drag & drop cards between columns ✅ (native HTML5)
  - [x] Multiple checklist states: Todo, Doing, Done, Event, Event Done, Note, Cancelled ✅
  - [x] Notched card design (brand motif) ✅
  - [x] Board does not replace Today Screen ✅
  - [x] No analytics/metrics on board activity ✅
  - [x] Phase alignment: P1 planning dump, P2 review context, P3 templates, P4 AI summaries ✅

## 11. Finance System (PRD 5.4, 6.7, 10.6)

- [x] **Basic Finance**
  - [x] Views (Transactions, Accounts)
  - [x] Basic CRUD
- [x] **Atomic updates: transaction + account balances in one operation** ✅ NEW
- [x] **Idempotency on transaction create (`idempotency_key`)** ✅ NEW
- [x] **Link transaction → task / note (P2)** ✅ NEW
- [x] **Negative balance handling (configurable strict vs soft)** ✅ NEW
- [x] **Recurring transactions + smart defaults (P2)** ✅ NEW
- [ ] Subscription tracker (renewal dates, trials, draft charges) (P2+)
- [ ] Budget caps (soft warnings per category) (P2+)
- [ ] Reconciliation endpoint + audit (P3+)
- [ ] Adjustments for edits, never hard delete (P3+)

## 12. Calendar & Planning (PRD 4.8)

- [x] **Views**
  - [x] **Weekly View (Slider with swipe support)** ✅ NEW
  - [x] Monthly View (Grid)
- [x] Ensure Views call `ensure_instances` for date range
- [x] **Density indicators (dots showing task counts)** ✅ NEW
- [x] Monthly view read-only; click -> Day view

## 13. Reviews & Public Profile (PRD 4.7, 6.8, 6.12, 6.18)

- [x] **Weekly Review screen** ✅ NEW
- [x] **Monthly Review screen with heatmap** ✅ NEW
- [x] Recovery-focused copy, no pressure ✅ (heatmap only public view)
- [x] **Public profile default ON with instant toggle** ✅ NEW
- [x] **Public view shows heatmap only (no finance, no task/habit details)** ✅ NEW

## 14. Landing Page (PRD 6.11, 6.14)

- [ ] Earth-tone landing page (aspirational, minimal motion)
- [ ] Read-only app preview window (Tasks / Habits / Finance tabs)
- [ ] No gamification visuals, no onboarding flow inside preview

## 15. System Jobs & Observability (PRD 4.6, 10.7, 10.8)

- [x] `/api/v1/system/end-of-day` (auto-skip habits, generate `daily_snapshots`) ✅ NEW
- [ ] Cron auth token enforcement for system endpoints
- [ ] Request logging with `request_id`
- [ ] Audit logs for sensitive actions (finance edits, exports)

## 16. UX Quality & Accessibility (PRD 6)

- [x] Rounded corners (12-16px cards, pill buttons) ✅ (`--radius: 0.75rem` in globals.css)
- [x] Soft elevation, no heavy shadows ✅ (shadow-sm, shadow-md only)
- [x] Minimal motion, no bounce easing ✅ (transition-all, no spring animations)
- [x] Light-first UI (dark mode optional, P2+) ✅
- [x] Icons functional only; avoid decorative sets ✅ (lucide-react, purpose-driven)
- [x] Calm empty states and error states ✅ (EmptyState component, calm toasts)
- [x] Focus indicators visible, keyboard navigation works ✅ (ring-2, focus-visible)
- [ ] Color contrast meets WCAG AA (needs automated audit tool, P2+)
- [x] Mobile responsiveness (sticky bottom CTA, add sheet comfort) ✅ (BottomDock, responsive sheets)

## 17. Testing & QA (PRD 7)

- [ ] Logical_day unit tests (timezone + DST)
- [ ] Streak calculation tests
- [ ] Balance calculation tests
- [ ] RLS verification (user isolation, server-only tables)
- [ ] API envelope + idempotency integration tests
- [ ] End-of-day + reminders job tests
- [ ] Accessibility checks (keyboard, labels, contrast)

## 18. Phase 3-4 Backlog (PRD 8)

- [ ] Advanced analytics (task/habit/finance correlations) (P3+)
- [ ] Exports (CSV/PDF summaries) (P3+)
- [ ] Pro paywall for reviews/analytics (P3+)
- [ ] AI summaries & insights with explainability (P4+)
- [ ] Predictive but non-intrusive nudges (P4+)

## 19. Launch Readiness

- [ ] SEO & metadata (titles, OG tags)
- [ ] Final UX copy review (emotional safety pass)
- [ ] Verify Today Screen as default entry
