# PRD - Planner-Centric Life & Finance OS

> **Status:** Final v1.1 (Schema-Reviewed, Migration-Ready)
> **Last Updated:** 2026-01-15

---

## 1. Product Positioning

**Product Name:** Orbit

**Brand Name:** Orbit
_Alternate Brand Name: OrbitOS, Orbital_
Tagline: **"Run your day calmly"**

Brand Intent:

- Calm, earthy, premium
- Orbit represents the natural rotation of a day around a clear center
- The product positions the day as the primary unit of execution
- Control is achieved through rhythm and structure, not pressure or optimization

**Core:** Daily Planner (what to do today)

**Supporting Systems (Modular):**

- Habit & Reminder Engine (optional)
- Budgeting & Multi-Account Finance (optional)
- Gamification Layer (points, streaks, levels)
- AI Insight Layer (future, optional)

> This product is **not a habit game or social leaderboard**.
> It prioritizes **daily execution clarity** over public performance.
> **Gamification is intentionally limited to habit formation only.**

> This is not a tracker app. This is a **Life Execution System**.

---

## 2. Core Philosophy

- Planner is the **single source of truth**
- Everything attaches to **time (logical day)**
- Habits are **repeatable tasks**, not a separate concept
- Money moves are **flows between accounts**, not isolated expenses

### Logical Day Concept (CRITICAL)

All activities are mapped to a **logical_day (DATE)** derived from the user's timezone.

Rules:

- `logical_day` is calculated from user timezone, not raw UTC timestamp
- Tasks, habit confirmations, reminders, and transactions all resolve to a logical day
- Streaks, daily snapshots, and analytics rely on logical_day consistency
- Timezone is stored on profile and treated as the source of truth (frozen until user confirms a change)
- If device timezone differs, prompt for confirmation before updating profile timezone
- Timezone changes apply forward-only; historical logical_day values are not recomputed

This prevents edge cases across timezones (late-night confirmations, travel, DST).

---

## 3. User Activation Flow (Modular)

During onboarding, user selects modules:

- [x] Daily Planner (default)
- [x] Reminders & Habits
- [x] Budgeting & Finance

Modules can be enabled/disabled later.

---

## 4. Daily Usage Flow

This section describes **how a real user moves through the app**, end-to-end, on a normal day.

### 4.1 Onboarding -> First Day

1. User signs up / logs in
2. Selects active modules:
   - Daily Planner (default)
   - Habits & Reminders (optional)
   - Budgeting & Finance (optional)
3. Sets timezone (used for logical_day, frozen until user confirms changes)
4. Lands directly on **Today Screen** (no dashboard detour)

---

### 4.2 Today Screen (Main Entry)

The Today Screen is the **single daily control center**.

User can:

1. View list of today's tasks & habits
2. Quick add:
   - Task
   - Habit
3. Quick filters:
   - All / Pending / Done / Skipped
   - Habits only toggle
4. Update task status:
   - Done
   - Skipped
   - Delayed (auto-move to next day)
5. See lightweight summary:
   - Tasks completed today
   - Habit streak status
   - Money moved today

---

### 4.3 Habit Execution Flow

1. User creates a Habit (via Add Habit)
2. System generates task_instances per logical_day
3. Reminder is sent (email / push, best-effort)
4. User confirms action:
   - Mark as done -> earn points
   - No confirmation -> auto-mark as skipped (UI: "Not completed today")
5. Streak updates based on daily habit completion

---

### 4.4 Notes -> Tasks Flow

1. User creates a Note (e.g. Bills, Meeting, Weekly Planning)
2. Adds checklist items inside the note
3. Converts checklist item into a Task
4. Task appears on Today Screen on scheduled day

Notes remain as context and are not bound to a single day.

---

### 4.5 Tasks -> Finance Flow

1. User completes a Task related to spending (e.g. "Pay rent")
2. User records a Transaction:
   - Selects source/destination account
   - Enters amount
3. Transaction may link to:
   - Task instance (execution)
   - Note (context)
4. Account balance updates automatically (source decreases, destination increases)

---

### 4.6 End of Day Resolution

At the end of a logical_day:

- Unconfirmed habit instances -> marked as skipped
- Delayed tasks -> moved to next available day
- Daily snapshot is generated:
  - Tasks done
  - Money in/out
  - Points earned

---

### 4.7 Weekly / Monthly Review (Phase 2+)

1. User opens Review screen
2. Sees summaries:
   - Task completion trends
   - Habit consistency
   - Finance overview
3. Notes and reflections may be attached to reviews

---

### 4.8 Long-Term Usage (Phase 3-4)

- Historical comparisons
- AI-assisted summaries (optional)
- Predictive but non-intrusive suggestions

---

## 5. Feature Scope

### 5.1 Daily Planner (CORE)

- Create tasks (one-time or scheduled)
- Assign date & time
- Status tracking
- Optional notes

---

#### 5.2 Habit & Reminder Engine

Habits are **repeatable tasks**, but UX explicitly distinguishes **Task vs Habit** to match user mental models.

**Add Button UX (Recommended):**

- `+ Add` -> dropdown:
  - **Add Task** (one-time or scheduled)
  - **Add Habit** (guided repeat setup)

Both paths create records in the same `tasks` table.

Design principles:

- **Task**: one-off or irregular work (meeting, assignment, errand)
- **Habit**: recurring behavior (read book, workout)
- No schema duplication; difference is UX + repeat rules

Habit features:

- Auto-enable repeat rules
- Reminder required by default
- Confirmation required (manual)
- Auto-expire to _not completed today_ (UI copy)
- Repeat rule helpers (Phase 2+):
  - Weekday-only / weekend-only presets
  - Exclude specific days (e.g., Fri)

System mapping:

- UI: use neutral copy like "Not completed today" / "No action today" (no game/failure wording)
- System status: `skipped`

This avoids guilt-driven UX while keeping data explicit.

This approach balances **clarity for users** with **schema simplicity**.

---

### 5.3 Gamification Layer

**Gamification applies ONLY to Habits (not one-off Tasks).**

Design rationale:

- Tasks = execution / productivity
- Habits = behavior change -> reward system belongs here

Rules:

- Points earned **only when a Habit instance is completed**
- One-off Tasks give **no points** (to avoid grinding)
- Daily point cap still applies
- Streak tracking **per day** (if at least one habit completed)

Data rules:

- Points are **derived from habit completion logs**, not arbitrary counters
- `gamification_stats` stores aggregated values only
- **Future note (Phase 2):** introduce `point_logs` for detailed audit & analytics

Levels & achievements are derived from long-term habit consistency.

---

### 5.4 Budgeting & Finance System

- Budget-style planner: track money in/out per logical day
- Multiple money accounts (bank/savings, cash, e-wallet, investment)
- Accounts store opening balance and current balance (auto-updated)
- Each account has a `currency_code` (multi-currency); totals are grouped by currency with no auto-conversion
- Accounts support optional icons for quick recognition
- Transaction categories are user-defined (with seeded defaults for income/expense)
- Transactions as flows:
  - Income: choose destination account, balance increases
  - Expense: choose source account, balance decreases
  - Transfer/Investment: choose from + to accounts, balances update
- Phase 1 supports income and expense only; transfer and investment are Phase 2
- Phase 2 adds recurring transactions with flexible schedules (custom intervals), reminders/drafts, and optional end date or occurrence limit
- **Subscription Tracker (Phase 2+)**:
  - Track subscriptions with provider, amount, cadence, next charge date, and status (active/paused/cancelled)
  - Generate upcoming charges as **draft transactions** (user-confirmed) to avoid accidental posting
  - Gentle renewal reminders (no pressure language), with optional "cancelled" mark
  - Supports free trials and variable billing dates
- **Budget caps (Phase 2+)**:
  - Optional soft caps per category (warning only, no blocking)
  - Calm copy for over-cap events
- Optional receipt attachment on transactions (upload only; OCR deferred to P3+)
- Negative balances are allowed with a soft warning (no hard block)

## 5.5 Notes & Context System (Supporting Feature)

Notes provide **context**, not execution.\
They are designed to capture thinking, planning, coordination, and references that **support the Daily Planner**, not replace it.

### Positioning

- Notes are available from **Phase 1** as a **supporting feature**
- Notes are **not the core workflow**
- The **Planner (tasks & habits)** remains the single source of execution truth

> Notes exist to answer _"what is this about|"_,\
> Planner exists to answer _"what do I need to do today|"_

---

### Core Use Cases

Notes are intended for scenarios such as:

- Meeting notes (action items, follow-ups)
- Weekly planning & reflection
- Bills & payments (rent, electricity, water, subscriptions)
- Project or side-project notes or college homework
- Personal planning or lightweight journaling

Notes may span **multiple days** and are **not bound to a single logical day**.

---

### Capabilities (Phase 1)

- Create standalone notes
- Notes may include:
  - Rich text content
  - Checklists
  - Embedded references (dates, tasks, money)
- Optional attachments (Phase 2+):
  - Images / files linked to notes
  - No document-workspace behavior (keep notes lightweight)
- Convert checklist items into **Tasks**
- Link notes to:
  - Tasks (e.g. meeting action items)
  - Transactions (e.g. bill payment context)

Notes **do not award points** and **do not affect streaks**.

---

### Templates vs Free-Form Notes

Notes support **both structured and free-form usage** through templates.

**Default templates provided:**

- Blank note
- Meeting Notes
- Weekly Planning
- Bills & Payments
- Project / Side Hustle Notes

Templates:

- Provide structure and guidance
- Are optional
- Can be modified freely by users

This avoids forcing users into rigid structures while still offering helpful defaults.

---

### Relationship to Tasks & Finance

Notes act as a **context hub**:

- A note may generate multiple tasks
- A task may reference a note (optional)
- A transaction may reference:
  - a task (execution)
  - a note (context)

Example flow:

```
Bills Note
 -> Checklist: "Pay rent"
 -> Convert to Task
 -> Task completed
 -> Transaction recorded (linked)

```

This enables **Planner <-> Notes <-> Finance** correlation without forcing users into complex workflows.

---

### Design Rules & Constraints

- Notes must never replace the Today Screen
- Notes must not become a document-centric workspace (e.g. Notion clone)
- Notes are contextual, not authoritative
- Notes should encourage action, not passive storage

---

### Phase Evolution

- **Phase 1:** Notes as lightweight context & task generator
- **Phase 2:** Notes integrated with weekly/monthly reviews
- **Phase 3:** Notes included in exports & analytics
- **Phase 4:** Notes used as input for AI-assisted summaries (optional)

---

## 6. UI / UX PRINCIPLES & DECISIONS (Final - Locked)

> This section translates product philosophy into **concrete UX & visual rules**.
> It exists to prevent feature creep, habit-game drift, and trendy-but-fatiguing design.

---

### 6.1 Visual Identity & Design Tone (LOCKED)

**Overall tone:**

- Calm
- Soft
- Earth-tone inspired
- Low visual fatigue
- Adult & trustworthy

**Explicit anti-patterns (DO NOT USE):**

- No Neon or high-contrast gradients
- No Blue as primary brand identity
- No Gamification visuals on landing page
- No Excessive icons or decorative noise

**Design principle:**

> UI should reduce cognitive load, not compete for attention.

---

### 6.2 Color Direction

**Primary direction:** Earth tone (warm & neutral)

Guidelines:

- Warm off-white / beige backgrounds
- Muted green / olive as primary accent
- Brown / terracotta as secondary accent
- Blue allowed **only** for informational states (non-branding)

Color usage rules:

- Color = signal, not decoration
- Accent colors are used sparingly
- No rainbow or multi-accent UI

---

### 6.3 Light-First Interface Strategy

- Dashboard is **light-first by default**
- Dark mode is optional and deferred (Phase 2+)

Rationale:

- Supports long usage sessions
- Reduces fatigue for planning & finance work

---

### 6.4 Navigation Structure

**Chosen:** Option A - Minimalist

Navigation may be implemented as **sidebar or top navbar**, but structure is fixed:

- **Today** (primary, default landing)
- **Notes** (context & planning)
- **Finance** (money management)
- **Settings** (habits, reminders, profile)

Rules:

- No separate "Habits" page in primary navigation
- Habits are managed via **Add Habit** and Settings
- Avoid dashboard overload

---

### 6.5 Add Interaction (Global)

- `+ Add` is **global**, not contextual
- Users may add:
  - Task (any future date)
  - Habit (repeat rule)
  - Note
  - Transaction
- Add flows use a modern sheet (mobile bottom / desktop right) with rounded corners, calm motion, and full accessibility. Avoid full-page detours for quick actions.
- Popovers are for tiny inline controls only (status menu, date picker), not multi-field forms.
- Modals are reserved for confirmations and destructive actions.

Rationale:

- Users plan across multiple days
- Adding should never be blocked by context

---

### 6.5.1 Sheet Accessibility and Keyboard (NEW)

- Focus trap inside sheets and modals; focus returns to the trigger on close
- ESC closes, Enter submits (when valid), and Tab order matches visual order
- Visible focus ring on all interactive elements (do not remove outline)
- All add flows are keyboard reachable and labeled (aria-labels on icon-only actions)
- Provide a skip-to-content link on nav-heavy screens

---

### 6.5.2 Today Screen Layout Spec (NEW)

**Goal:** hit the 30-second rule with a calm, low-friction layout.

**Desktop layout (recommended):** two-column

- **Left (primary):** date header + quick add + task/habit list
- **Right (secondary):** summary card + habit ring + finance quick log

**Mobile layout (recommended):** single column

- Header/date
- Summary card
- Quick add entry
- Task/habit list
- Habit ring
- Finance quick log

**Quick add placement (best practice):**

- Desktop: global `+ Add` in header (right side) + inline "Add task" row at top of list (opens sheet)
- Mobile: sticky bottom pill button for `+ Add` (respect safe area, avoid overlapping other fixed elements)

**List style:**

- Today uses **simple list rows** for speed
- Task detail screens can use **cards per item** (similar to Notes)
- Quick filters live above the list and remain one-tap reachable

**Accent usage (subtle):**

- Tasks: neutral ink/stone
- Habits: muted green/olive badge or dot
- Finance: terracotta/brown accent for totals or labels

**Stability & motion:**

- Reserve space for async content to avoid layout shifts
- Minimal motion, no bounce easing

---

### 6.5.3 Card Inventory & States (NEW)

- **Summary card:** tasks done, habits done, money in/out (no gamified totals outside habits)
- **Task row:** title, optional time, status control, optional note link
- **Habit row:** task row + repeat indicator + gentle confirmation feedback (no XP bars)
- **Habit ring card:** subtle day ring showing **habit confirmations only**
- **Finance quick log card:** income/expense selector, amount, account, save
- **Empty state card:** supportive copy + optional action
- **Loading state:** skeletons with fixed heights to prevent jumping

---

### 6.6 Task vs Habit Visual Distinction

- Tasks and Habits share the same data schema
- Visual distinction exists to match mental models

Habit visuals should:

- Be slightly more expressive than tasks
- Encourage consistency without pressure

Examples (non-binding):

- Subtle accent color
- Repeat icon
- Gentle micro-feedback (no XP bars)

Rule:

- Habit UI must **encourage**, never pressure or shame

---

### 6.7 Finance UX Placement & Trust Model

Finance is treated as **serious & high-trust**.

Rules:

- Full editing, history, reconciliation -> **Finance screen only**
- Quick logging (expense / income):
  - Allowed from Today Screen
  - Allowed for past days
- Add Transaction supports optional linking to Task and/or Note; Quick Finance stays minimal (no linking)
- Subscription tracker lives inside Finance (not Today), with upcoming charges list and gentle reminders

Rationale:

- Speed for daily life
- Safety and confidence for money handling

---

### 6.8 Review Screen Tone (Phase 2+)

Review focuses on **days executed**, not habit grinding.

Heatmap behavior:

- A day lights up if **any meaningful execution occurred**:
  - Task completed
  - OR habit confirmed
  - OR financial activity recorded

Rules:

- No punishment language
- Missed days are neutral
- Recovery is emphasized over streak perfection

---

### 6.9 Emotional Safety & Motivation

UX guarantees:

- Users may have empty days with no penalty
- No forced inputs
- No guilt-driven messaging

If a user failed yesterday:

- Show supportive or neutral motivation
- Never surface negative metrics first

Example tone:

> "Yesterday was heavy. Today is a fresh page."

---

### 6.10 30-Second Usage Rule

If a user has **30 seconds**, they must be able to:

- Add a task
- Add an expense or income
- See what matters today

Anything that blocks this is a UX regression.

---

### 6.11 Landing Page Visual Rules

Landing page is **aspirational**, not operational.

Rules:

- Earth-tone palette (slightly richer than dashboard)
- Minimal animation
- No gamification elements
- No dense metrics or charts

**Interactive preview rules:**

- Read-only UI
- Displays only core modules:
  - Tasks
  - Habits
  - Finance
- Styled as a rounded app window
- No data entry, no onboarding flow

Purpose:

> Let users _feel_ the product without interacting.

---

### 6.12 Public Profile & Heatmap Visibility

- Public profile & heatmap:
  - Default ON
  - Can be turned OFF anytime

Rules:

- Visibility must never pressure behavior
- No social comparison mechanics

---

### 6.13 Component & Layout Design Style (LOCKED)

This section defines **how the UI feels at a component level**, regardless of feature.

#### Shape & Geometry

- Rounded corners are **default**
- No sharp, boxy enterprise UI

Guidelines:

- Cards: medium-rounded (~12-16px)
- Buttons: rounded (pill for primary actions, soft radius for secondary)
- Inputs: rounded with soft borders
- Modals & sheets: rounded container, never full-bleed

Purpose:

> Rounded geometry reduces visual tension and supports calm planning.

---

#### Elevation & Depth

- Use **soft elevation**, not hard shadows
- Avoid heavy drop shadows or neumorphism

Guidelines:

- Cards: subtle shadow or border (never both aggressively)
- Active elements: slight lift or background tint
- Depth is used to separate sections, not to decorate

---

#### Spacing & Density

- UI density is **comfortable**, not compact
- Generous whitespace is intentional

Rules:

- Fewer items per screen
- Clear separation between sections
- Avoid cramming information

Principle:

> Calm spacing improves decision-making and reduces fatigue.

---

#### Iconography

- Icons are **functional only**
- No decorative icon sets

Rules:

- Icons support actions, not branding
- Prefer text + icon (not icon-only)
- Consistent stroke weight

---

#### Motion & Feedback

- Motion is minimal and purposeful

Guidelines:

- Micro-animations for:
  - Task completion
  - Habit confirmation
  - Navigation transitions
- Duration: short & subtle
- No bounce, no playful easing

Rule:

> Motion should confirm actions, not entertain.

---

#### Typography Hierarchy

- Clear hierarchy, no oversized headlines

Guidelines:

- Titles: calm, not loud
- Body text: readable, generous line-height
- Numbers (finance): aligned, stable, legible

Avoid:

- Stylized display fonts
- Excessive font weight variation

---

### 6.14 Landing Page Preview Style

Preview design rules:

- Styled as a **rounded app window** (desktop OS style)
- Soft shadow, floating on page
- Earth-tone UI identical to dashboard (no fake theme)

Preview behavior:

- Read-only
- Switch tabs (Tasks / Habits / Finance)
- No editable fields
- No onboarding or modal interruptions

Purpose:

> Show what daily usage _feels like_, not how to configure the app.

---

### 6.15 Empty State UX Principles (NEW)

Empty states are treated as **emotionally sensitive moments**, not errors.

Scenarios:

- New user with no data
- Intentional rest day
- Burnout or recovery period

Rules:

- Never imply failure or guilt
- Never force data input
- Keep actions optional

UI guidance:

- Calm, reassuring copy
- Clear but non-pushy actions

Example tone:

> "Nothing planned today - and that's okay." "You can rest, or add something when you're ready."

---

### 6.16 Failure & Error UX Stance (NEW)

Errors are categorized by **user impact**, not technical cause.

Principles:

- Be honest, calm, and brief
- Avoid technical jargon
- Do not escalate emotional stress

Guidelines:

- Reminder delivery failures:
  - Silent by default
  - Surface only if repeatedly failing

- Finance errors:
  - Insufficient balance -> soft warning (no hard block)
  - No destructive actions without confirmation

- System delays (cron, sync):
  - Graceful fallback
  - Never block Today Screen

Tone example:

> "We couldn't complete this right now. Nothing is lost."

---

### 6.16.1 Undo and Recovery (NEW)

- Confirm before destructive actions (delete, remove, irreversible changes)
- Provide Undo for non-destructive changes (done, skipped, delayed) for 6-10 seconds
- Transactions are not hard-deleted; recovery uses a reversal/adjustment flow
- Undo copy is neutral and calm (no blame, no urgency)

---

### 6.16.2 Loading and Optimistic States (NEW)

- Show submit loading state immediately (button spinner + disabled state)
- Use optimistic updates for simple status toggles; revert on failure with calm copy
- Prefer inline progress over full-screen blocking spinners
- Use skeletons for initial list loads; keep Today Screen visible

---

### 6.17 Language & Microcopy Guidelines (NEW)

Language sets emotional tone and trust level.

Rules:

- Calm, supportive, non-preachy
- Neutral motivation, not self-help hype
- Short sentences

Voice:

- Direct address ("you")
- No corporate or gamified language

Avoid:

- Shame-based copy
- Aggressive encouragement
- Over-celebratory language

---

### 6.18 Privacy & Data Ownership Boundaries (NEW)

User trust is foundational.

Privacy rules:

- Public profile shows **execution heatmap only**
- No financial data is ever public
- No habit/task details are public by default

Controls:

- Public profile can be disabled at any time
- Changes apply immediately

Data ownership stance:

> Users fully own their data and may export it at any time (Phase 3+).

---

### 6.19 Brand Identity System (Landing + App) (LOCKED)

To avoid generic "calm minimal" aesthetics, the product uses **signature brand motifs**:

**Primary motif: Day Ring / Orbit**

- Thin orbital ring lines represent `logical_day` and time flow
- Used in:
  - Landing hero background (subtle)
  - Section dividers / accents (subtle)
  - Key highlights (e.g., CTA area)

**Secondary motif: Premium Cards**

- Cards have a premium rounded aesthetic (glassmorphism + rounded-3xl)
- Used in:
  - Feature cards
  - Preview mock
  - Key panels in-app

Rules:

- Motifs must remain subtle and consistent
- Motifs must not increase cognitive load
- Motifs must never look like gamification

---

### 6.20 Landing Page Branding & Conversion Rules (LOCKED)

Landing page must feel **bold and SaaS-grade** while staying earth-tone.

Conversion rules:

- Primary CTA: **"Create your first day"**
- CTA appears 4x minimum:
  - Navbar
  - Hero
  - After Preview
  - Final CTA
- Mobile sticky bottom CTA bar enabled

Landing hero rules:

- Big, commanding headline (direct)
- Strong typography hierarchy (premium)
- Social-proof chips allowed (no fake logos required)
- Pricing teaser allowed (minimal)

Still enforced:

- No neon gradients
- No blue as branding
- No gamification visuals on landing
- Icon usage minimal

---

### 6.21 Board-Style Workspace (OPTIONAL, SUPPORTING - NEW)

Orbit **may** provide a **board-style workspace** inspired by card-based planning tools (sticky notes / kanban-like), but with **strict constraints** so it does not replace the Today Screen or Planner.

This is a **supporting surface**, not a primary execution layer.

---

#### Purpose & Positioning

Board View exists to support:

- Brain-dumping
- Early planning
- Visual grouping of thoughts
- Lightweight organization

It does **not** exist to:

- Replace the Today Screen
- Replace Tasks / Habits
- Become a full kanban or Notion-style workspace

> Board View answers: _"How do I roughly organize my thoughts|"_
> Today Screen answers: _"What am I doing \***\*today\*\***|"_

---

#### Scope (Phase 1 - Limited)

- Board is implemented **inside Notes**, not as a separate core module
- Each board belongs to a **Note workspace**
- Cards are **notes or note blocks**, not tasks by default

Board capabilities:

- Multiple columns (customizable)
- Drag & drop cards between columns
- Free-form text inside cards
- Soft color accents (earth-tone palette only)

---

#### Relationship to Tasks & Planner

- Cards may contain:
  - Checklists
  - Text
  - References
- Checklist items **can be converted into Tasks**
- Converted Tasks:
  - Leave a reference link in the card
  - Appear on Today Screen when scheduled

Rules:

- Cards themselves are **not executable items**
- Completion of a card does **not** count as execution
- Execution always happens via Tasks / Habits

---

#### Visual & Interaction Rules

- Board uses **notched cards** (brand motif)
- Rounded cards with soft elevation
- No sharp kanban lanes
- No swimlanes with metrics

Color rules:

- Cards may have **soft background tint**
- No bright colors
- No priority colors (red / green meaning)

Motion:

- Drag & drop is smooth and calm
- No snapping animations
- No playful physics

---

#### Explicit Constraints (DO NOT VIOLATE)

- No WIP limits
- No status-based columns enforced by system
- No progress bars or percentages
- No gamification tied to cards
- No analytics on board activity

---

#### Phase Evolution

- **Phase 1:** Notes-based board for planning & dumping
- **Phase 2:** Boards usable in weekly/monthly review context
- **Phase 3:** Optional templates (e.g. Weekly Plan Board)
- **Phase 4:** AI summarization of board -> suggested Tasks (optional)

---

#### UX Guardrail (CRITICAL)

If a feature causes users to:

- Stay in boards all day
- Avoid Today Screen
- Treat cards as execution

That feature is **out of scope** and must be redesigned or removed.

---

> Orbit is **planner-centric**. Boards support thinking - they never replace doing.

---

### 6.22 Design System Implementation (CURRENT)

This section defines the **actual CSS tokens and patterns** implemented in the codebase.

#### Core Color Palette (CSS Variables)

| Token           | HSL Value   | Hex        | Usage                     |
| --------------- | ----------- | ---------- | ------------------------- |
| `--primary`     | 162 33% 27% | #2F5D50    | Forest Green - main brand |
| `--secondary`   | 16 50% 53%  | #C36A4A    | Terracotta - accents      |
| `--accent`      | 43 72% 50%  | Muted Gold | Highlights                |
| `--background`  | 33 33% 95%  | #F7F3EE    | Cream Organik             |
| `--card`        | 33 28% 92%  | -          | Card backgrounds          |
| `--foreground`  | 0 0% 9%     | #171717    | Text                      |
| `--destructive` | 0 62% 50%   | -          | Errors                    |

#### Component Styling Patterns

**Cards:**

- Border radius: `rounded-2xl` (16px) or `rounded-3xl` (24px) for hero cards
- Background: `bg-card/60` with `border border-border/30`
- Shadow: `shadow-sm` - never heavy shadows
- Hover: `hover:bg-card` or subtle scale `hover:scale-[1.01]`

**Buttons:**

- Primary: `bg-primary hover:bg-primary/90 rounded-xl` or `rounded-full`
- Dashed outline: `border border-dashed border-primary/30 bg-primary/5`
- Destructive: `border border-destructive/20 text-destructive`

**Dialogs/Modals:**

- Container: `rounded-2xl border border-white/20 bg-background/95 backdrop-blur-xl`
- Max width: `sm:max-w-[340px]` for compact forms
- Footer: `border-t border-white/10 bg-white/5`
- Submit button: `rounded-full h-11 w-full`

**Form Elements:**

- Labels: `text-[10px] uppercase tracking-wider text-muted-foreground font-semibold`
- Inputs: `bg-white/10 border-white/10 h-10 rounded-lg`
- Toggle buttons: `flex p-1 bg-muted/30 rounded-lg border border-white/10`

**Sidebar:**

- Background: `bg-gradient-to-b from-stone-50 to-stone-100/50`
- Profile card: `rounded-2xl bg-white/80 border border-stone-200/50`
- Nav items: `rounded-xl hover:bg-primary/5`

**Profile/Hero Cards:**

- Container: `rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card`
- Avatar: `rounded-full bg-gradient-to-br from-primary to-emerald-600`
- Level badge: Absolute positioned `rounded-full bg-secondary`
- Stat icons: `rounded-lg bg-{color}-100 text-{color}-600`

#### Typography Patterns

- Display: `font-display font-bold tracking-tight`
- Section headers: `text-xs font-semibold text-muted-foreground uppercase tracking-wider`
- Monospace (finance): `font-mono font-medium`

#### Navigation Structure (Updated)

- **Today** (primary, default landing)
- **Calendar** (collapsible: Daily, Weekly, Monthly)
- **Boards** (kanban workspace)
- **Notes** (context & planning)
- **Finance** (money management)
- **Habits** (habit tracking)
- **Profile** (user settings, gamification stats, reminders)

#### Micro-interactions & Animations

| Class                    | Effect                      | Usage                    |
| ------------------------ | --------------------------- | ------------------------ |
| `hover-lift`             | Lift + shadow on hover      | Cards, clickable items   |
| `hover-scale`            | Scale to 1.02 on hover      | Buttons, icons           |
| `click-scale`            | Scale to 0.98 on click      | All interactive elements |
| `hover-glow`             | Primary color glow on hover | Important CTAs           |
| `interactive-card`       | Lift + border highlight     | Dashboard cards          |
| `btn-press`              | Press down effect           | Buttons                  |
| `animate-fade-up`        | Fade in from bottom         | Page entrance            |
| `animate-checkmark`      | Draw checkmark SVG          | Task completion          |
| `animate-success-pulse`  | Green pulse ring            | Success feedback         |
| `animate-shake`          | Horizontal shake            | Error feedback           |
| `animate-slide-in-right` | Slide from right            | List items               |
| `animate-pop-in`         | Scale pop entrance          | Badges, notifications    |
| `animate-float`          | Gentle up/down float        | Hero elements            |
| `shadow-glow`            | Soft primary glow           | Highlighted elements     |

---

## 7. Pricing-Ready Feature Gating

| Feature             | Free  | Pro (Full)               |
| ------------------- | ----- | ------------------------ |
| Tasks / Planner     | Yes   | Yes                      |
| Reminders           | No    | Yes                      |
| Habits (repeat)     | No    | Yes                      |
| Multi Accounts      | 1     | Unlimited                |
| Gamification        | Basic | Full                     |
| Reviews & Insights  | No    | Yes                      |
| AI-Powered Insights | No    | Optional Add-on (Future) |

**Gamification definition:**

- **Basic:** points, daily streak
- **Full:** achievements, analytics, level rewards

---

## 8. Technical Implementation Logic (Schema Validation)

### 8.1 Schema Validation - Calendar & Today (Executable Contract)

This section ensures the schema supports the **Today Screen**, **Weekly slider**, and **Monthly calendar click** without ambiguity. This is written so it can be executed directly in implementation.

### 8.2 View -> Source of Truth

- **Today Screen (execution):** `task_instances` + `transactions`
- **Weekly (planning):** `task_instances` (planned per day) + light day density
- **Monthly (awareness):** aggregated counts per day from `task_instances` (optionally enriched by `daily_snapshots.executed` for past days)

**Hard rule:** Calendar views NEVER read day contents directly from `tasks`. `tasks` are templates; **instances are the plan**.

---

### 8.3 Required engine: `ensure_instances(user_id, start_day, end_day)`

To make Weekly/Monthly reliable, the system must guarantee:

- For any displayed day-range (week/month), all relevant tasks/habits have a `task_instance` for each applicable `logical_day`.

**Phase 1 (MVP) implementation = on-demand**

- When user opens Weekly/Monthly or selects a day, call `ensure_instances` for that range.

`ensure_instances` must:

1. Load all active tasks: `tasks.deleted_at IS NULL` for the user.
2. For each day in range:
   - If no `repeat_rules` row exists (one-off): create instance only if scheduled for that day.
   - If `repeat_rules` exists (habit/repeat): create instance if rule matches that day.
3. Upsert into `task_instances` using UNIQUE `(task_id, logical_day)`.

**Scheduling rule (Phase 1 simple):**

- One-off tasks store their intended day in `tasks.scheduled_at` (date portion).
- Optional time-of-day in `tasks.scheduled_at`.

This keeps planning queries simple and avoids extra columns.

---

### 8.4 Today Screen - canonical query behavior

Input: `user_id`, `logical_day`

Reads:

- `task_instances` WHERE `(user_id, logical_day)`
- JOIN `tasks` for display fields (title, scheduled_at)
- `transactions` WHERE `(user_id, logical_day)` for money moved

Sort:

1. timed tasks (`tasks.scheduled_at` has a time component) ascending
2. untimed tasks
3. habits either inline or lightly grouped (by presence of `repeat_rules`)

Status rules:

- completion toggles update `task_instances.status`
- habit confirmations update `task_instances.status` and points (if enabled)

---

### 8.5 Weekly slider - canonical behavior

Input: `user_id`, `week_start_day`..`week_end_day`

Steps:

1. `ensure_instances(user_id, week_start_day, week_end_day)`
2. Compute day density (light indicator):
   - `count(task_instances)` per day (optionally excluding `skipped`)
3. When user selects day `D`:
   - fetch same shape as Today Screen for `D`

Weekly must NOT:

- compute completion percentages
- show progress charts

Allowed actions:

- add task to a day (sets `tasks.scheduled_at` date, then ensures instance)
- move task between days (move instance, preserve `original_logical_day` if it was delayed)

---

### 8.6 Monthly grid - canonical behavior

Input: `user_id`, `month_start_day`..`month_end_day`

Steps:

1. Option A (Phase 1 accurate): `ensure_instances(user_id, month_start_day, month_end_day)`
2. Aggregation for indicators:
   - `planned_count[D] = count(task_instances WHERE user_id AND logical_day=D)`
   - `executed[D]`:
     - for past days: read `daily_snapshots.executed` if exists
     - for future days: null/false
3. On click day `D`:
   - show list of instances for that day (tasks + habits)

Monthly must NOT:

- allow editing directly in the grid
- show streak visuals

---

### 8.7 Index & constraint checklist

Must have:

- `task_instances (task_id, logical_day) UNIQUE`
- `task_instances (user_id, logical_day)` index
- `transactions (user_id, logical_day)` index

Recommended:

- `task_instances (user_id, status, logical_day)` index (faster filtering)
- `tasks (user_id, deleted_at)` index

---

### 8.8 Consistency rules (anti-bug)

- All day calculations use `users_profile.timezone` -> derive `logical_day` consistently (frozen until user confirms change; changes apply forward-only).
- Instances are the planning surface; tasks are templates.
- Points are derived from habit completion in `task_instances` (done confirmations), not arbitrary counters.
- Delayed tasks must preserve `original_logical_day` and `delayed_to_day`.

---

## 9. API Contract (Scalable - TODO)

> This section will define stable endpoints and response shapes for Today / Weekly / Monthly / Habits / Notes / Finance.

**Minimum endpoints (Phase 1):**

- `POST /api/ensure-instances` (range)
- `GET /api/today|day=YYYY-MM-DD`
- `GET /api/week|start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/month|start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/tasks` (create task/habit)
- `PATCH /api/task-instances/:id` (done / skipped / delayed)
- `POST /api/transactions` (quick log)
- `POST /api/notes`
- `PATCH /api/notes/:id`

Conventions (LOCKED):

- Inputs validated (zod or equivalent)
- Consistent error shape
- Idempotency required for all write endpoints (including finance)

---

## 10. Security & Data Isolation (Supabase RLS - LOCKED)

This section defines **mandatory Row Level Security (RLS)** rules. Misconfiguration here is considered a **critical vulnerability**.

---

### 10.1 Global Security Principles

- **RLS enabled on every table** (no exception)
- **Default deny**: no implicit access
- All access is scoped by `user_id = auth.uid()`
- No table is ever publicly readable or writable

> If RLS is disabled on any table, the system is considered compromised.

---

### 10.2 Authentication Assumptions

- Supabase Auth is the single identity provider
- `auth.uid()` is the canonical user identifier
- `users_profile.user_id` = `auth.uid()`

---

### 10.3 Table-Level RLS Policies (Phase 1)

See **Final Database Schema** section for specific SQL implementation.

---

### 10.4 Join Safety Rules

All joins must be **safe by construction**:

- `task_instances.task_id -> tasks.id` is safe because:
  - both tables enforce `user_id = auth.uid()`

- `transactions.task_instance_id -> task_instances.id` is safe only if:
  - transaction `user_id` matches instance `user_id`

Do **not** rely on frontend filtering for security.

---

### 10.5 Service Role & Background Jobs

Service role access:

- Used only for:
  - `ensure_instances` engine
  - reminder dispatch
- Never exposed to client

Rules:

- Service role must still scope queries by `user_id`
- No cross-user batch jobs without explicit admin tooling

---

### 10.6 Explicit Anti-Patterns (DO NOT DO)

- No Disable RLS for debugging
- No Use `public` read access
- No Trust frontend `user_id` input
- No Cross-user analytics queries

---

### 10.7 Security Review Checklist (MANDATORY)

Before launch:

- Verify `RLS enabled` on all tables in Supabase Dashboard.
- As user A, attempt to read/insert rows owned by user B (must fail).
- Attempt to insert a transaction referencing another user's account_id (must fail).
- Attempt unauthenticated queries (must fail).

---

# FINAL DATABASE SCHEMA (Supabase / PostgreSQL)

## 1. users (Supabase Auth)

```sql
id (uuid, pk)
email
created_at
```

---

## 2. profiles

```sql
id (uuid, pk)
user_id (uuid, fk)
display_name
timezone
active_modules JSONB
created_at
```

---

## 3. tasks (CORE ENTITY)

```sql
id (uuid, pk)
user_id (uuid, fk)
title
description
scheduled_at TIMESTAMPTZ
is_template BOOLEAN
created_at
deleted_at                   -- added (soft delete)
```

---

## 4. task_instances (daily execution)

```sql
id (uuid, pk)
user_id (uuid, fk)
task_id (uuid, fk)
logical_day DATE
original_logical_day DATE
delayed_to_day DATE
status ENUM('pending','done','skipped','delayed')
UNIQUE(task_id, logical_day)

-- Status semantics:
-- pending  : task exists for the logical day and is in progress
-- done     : task completed and confirmed on that logical day
-- skipped  : explicitly declined or missed (no confirmation)
-- delayed  : auto-moved to next available logical day
confirmed_at TIMESTAMP
```

> Every task execution lives here

---

## 5. repeat_rules (habit engine)

```sql
id (uuid, pk)
user_id (uuid, fk)
task_id (uuid, fk)
rule_type ENUM('daily','weekly','custom')
rule_config JSONB
```

**`rule_config` JSONB Structure:**

```jsonc
// rule_type: "daily" - repeats every day at specified time
{ "time": "21:00" }

// rule_type: "weekly" - repeats on specific days of the week
{ "days": ["mon", "wed", "fri"], "time": "09:00" }

// rule_type: "custom" - repeats at custom interval
{ "interval": 3, "unit": "days", "time": "18:00" }
// Valid units: "days", "weeks", "months"
```

---

## 6. reminders

```sql
id (uuid, pk)
user_id (uuid, fk)
task_id (uuid, fk)
channel ENUM('push','email')
scheduled_at TIMESTAMP
is_active BOOLEAN
```

---

## 7. gamification_stats

```sql
id (uuid, pk)
user_id (uuid, fk)
points INTEGER
level INTEGER
current_streak INTEGER       -- added
longest_streak INTEGER       -- added
last_streak_date DATE        -- added
updated_at
```

> See IMPROVEMENTS section for complete corrected schema with streak fields.

---

## 8. money_accounts

```sql
id (uuid, pk)
  user_id (uuid, fk)
  name
  type ENUM('bank','cash','ewallet','investment')
  currency_code TEXT          -- e.g., 'IDR'
  icon TEXT                   -- optional (Lucide name)
  opening_balance NUMERIC
  current_balance NUMERIC
is_active BOOLEAN            -- added
created_at
deleted_at                   -- added (soft delete)
```

> `current_balance` is denormalized for fast reads and updated on each transaction.

---

## 9. transaction_categories

```sql
id (uuid, pk)
user_id (uuid, fk)
name
type ENUM('income','expense')
icon TEXT
created_at
deleted_at
```

---

## 10. transactions

```sql
id (uuid, pk)
user_id (uuid, fk)
from_account_id (uuid, nullable)
to_account_id (uuid, nullable)
amount NUMERIC
type ENUM('income','expense','transfer','investment')
logical_day DATE
currency_code TEXT
description                  -- renamed from 'note' to avoid collision
category                     -- user-defined category label
task_instance_id (uuid, nullable)
note_id (uuid, nullable)     -- FK to notes table
created_at
```

> Optional link to `task_instances` enables planner <-> finance correlation without forcing usage.

> Account balances are updated transactionally to keep consistency. Periodic reconciliation can be done by recalculating from transaction history.

---

## 10. daily_snapshots (performance & insight)

```sql
id (uuid, pk)
user_id (uuid, fk)
logical_day DATE
tasks_done INTEGER
money_in NUMERIC
money_out NUMERIC
points_earned INTEGER
UNIQUE(user_id, logical_day)        -- added
```

---

## 11. audit_logs (future SaaS safety)

```sql
id (uuid, pk)
user_id (uuid, fk)
action
entity_type                  -- added
entity_id (uuid)             -- added
metadata JSONB
created_at
```

---

## 12. notes

```sql
id (uuid, pk)
user_id (uuid, fk)
title
template_type ENUM('blank','meeting','weekly','billing','project')
content JSONB
created_at
updated_at
deleted_at                   -- added (soft delete)
```

---

## 13. notes_task_links

```sql
id (uuid, pk)
note_id (uuid, fk)
task_id (uuid, fk)
created_at
UNIQUE(note_id, task_id)
```

---

### Entity Relationship Summary

```
Note
 |-- generates -> Task
 |-- references -> Transaction
 |
Task
 |-- executed as -> Task Instance
 |
Transaction
 |-- may link -> Task Instance
 `-- may link -> Note
```

---

## DATABASE SCHEMA IMPROVEMENTS (Pre-Migration Review)

> **Status:** Reviewed - Apply these refinements before generating migrations.

### Issue #1: `gamification_stats` - Missing Streak Fields

PRD mentions "streak per day" but fields are missing.

**Corrected Schema:**

```sql
CREATE TABLE gamification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Issue #2: `transactions.note` vs `note_id` - Naming Collision

Current schema has both `note` (text) and `note_id` (FK), which is confusing.

**Fix:** Rename `note` -> `description`, add `logical_day` + `currency_code`, and enforce account shape by `type`

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES money_accounts(id),
  to_account_id UUID REFERENCES money_accounts(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
    logical_day DATE NOT NULL,
    currency_code TEXT NOT NULL,
    CHECK (
    (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
    (type = 'income' AND to_account_id IS NOT NULL AND from_account_id IS NULL) OR
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id <> to_account_id) OR
    (type = 'investment' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id <> to_account_id)
  ),
  description TEXT,                    -- renamed from 'note'
  category TEXT,                       -- user-defined category label
  task_instance_id UUID REFERENCES task_instances(id),
  note_id UUID REFERENCES notes(id),   -- FK to notes table
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Issue #3: `notes` & `notes_task_links` - Proper SQL Definition

Original PRD had formatting issues. Here's the corrected version:

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('blank', 'meeting', 'weekly', 'billing', 'project')),
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL   -- soft delete
);

CREATE TABLE notes_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(note_id, task_id)
);
```

**`notes.content` JSONB Structure:**

```json
{
  "blocks": [
    { "id": "uuid", "type": "paragraph", "content": "..." },
    { "id": "uuid", "type": "heading", "content": "..." }
  ],
  "checklist": [
    {
      "id": "uuid",
      "text": "Pay rent",
      "checked": false,
      "converted_to_task_id": null
    }
  ]
}
```

---

### Issue #4: Soft Delete Pattern - Missing `deleted_at`

PRD states "prefer soft delete" but fields are missing.

**Add to these tables:**

```sql
-- tasks
ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- notes (already included above)

-- money_accounts
ALTER TABLE money_accounts ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE money_accounts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

---

### Issue #5: `audit_logs` - Enhanced Tracing

Original schema lacks entity tracking for better debugging.

**Corrected Schema:**

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,        -- 'task', 'transaction', 'account', 'note'
  entity_id UUID,          -- reference to the affected record
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Issue #6: Required Indexes (Performance)

Add these indexes for query performance:

```sql
-- Core lookups
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_deleted ON tasks(user_id, deleted_at);

-- Task instances (Today screen, calendar views)
CREATE INDEX idx_task_instances_task_id ON task_instances(task_id);
CREATE INDEX idx_task_instances_user_logical_day ON task_instances(user_id, logical_day);
CREATE INDEX idx_task_instances_logical_day ON task_instances(logical_day);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_logical_day_status ON task_instances(logical_day, status);
CREATE INDEX idx_task_instances_user_status_logical_day ON task_instances(user_id, status, logical_day);

-- Finance queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_user_logical_day ON transactions(user_id, logical_day);
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_money_accounts_user_id ON money_accounts(user_id);

-- Daily snapshots (analytics)
CREATE INDEX idx_daily_snapshots_user_logical_day ON daily_snapshots(user_id, logical_day);

-- Notes
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_template_type ON notes(template_type);

-- Repeat rules
CREATE INDEX idx_repeat_rules_task_id ON repeat_rules(task_id);

-- Reminders
CREATE INDEX idx_reminders_task_id ON reminders(task_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_at) WHERE is_active = TRUE;

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

---

### Issue #7: Complete Corrected Schema Summary

Below is the **final corrected schema** ready for migration:

#### 1. users (Supabase Auth - no migration needed)

```sql
-- Managed by Supabase Auth
-- id UUID, email TEXT, created_at TIMESTAMPTZ
```

#### 2. profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  active_modules JSONB DEFAULT '{"planner": true, "habits": false, "finance": false}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

#### 4. task_instances

```sql
CREATE TABLE task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  logical_day DATE NOT NULL,
  original_logical_day DATE,
  delayed_to_day DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped', 'delayed')),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(task_id, logical_day)
);
```

#### 5. repeat_rules

```sql
CREATE TABLE repeat_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('daily', 'weekly', 'custom')),
  rule_config JSONB DEFAULT '{}'
);
```

#### 6. reminders

```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('push', 'email')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

#### 7. gamification_stats

```sql
CREATE TABLE gamification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 8. money_accounts

```sql
CREATE TABLE money_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'ewallet', 'investment')),
    currency_code TEXT NOT NULL DEFAULT 'USD',
    icon TEXT,
    opening_balance NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

#### 9. transaction_categories

```sql
CREATE TABLE transaction_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

#### 10. transactions

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_account_id UUID REFERENCES money_accounts(id),
  to_account_id UUID REFERENCES money_accounts(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
    logical_day DATE NOT NULL,
    currency_code TEXT NOT NULL,
    CHECK (
    (type = 'expense' AND from_account_id IS NOT NULL AND to_account_id IS NULL) OR
    (type = 'income' AND to_account_id IS NOT NULL AND from_account_id IS NULL) OR
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id <> to_account_id) OR
    (type = 'investment' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id <> to_account_id)
  ),
  description TEXT,
  category TEXT,
  task_instance_id UUID REFERENCES task_instances(id),
  note_id UUID REFERENCES notes(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 11. daily_snapshots

```sql
CREATE TABLE daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  logical_day DATE NOT NULL,
  tasks_done INTEGER DEFAULT 0,
  money_in NUMERIC DEFAULT 0,
  money_out NUMERIC DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, logical_day)
);
```

#### 11. audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 12. notes

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template_type TEXT CHECK (template_type IN ('blank', 'meeting', 'weekly', 'billing', 'project')),
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);
```

#### 13. notes_task_links

```sql
CREATE TABLE notes_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(note_id, task_id)
);
```

#### 14. idempotency_keys

```sql
CREATE TABLE idempotency_keys (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key UUID NOT NULL,
  endpoint TEXT NOT NULL,
  response_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, key, endpoint)
);
```

#### 15. point_logs (Phase 2+)

```sql
CREATE TABLE point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  task_instance_id UUID REFERENCES task_instances(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 16. reminder_deliveries (Phase 2+)

```sql
CREATE TABLE reminder_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  error_message TEXT
);
```

---

## 7. Scalablity & Architecture Notes

- Planner-centric schema (no duplication)
- Habits = repeatable tasks (no refactor later)
- Finance system ready for bank sync (Phase 3)
- RLS enforced per user
- Analytics derived from `daily_snapshots`
- System designed for **derivation over storage** (AI & insights ready)

---

## 8. Product Phases & Evolution Roadmap

> This section defines **what to build, why, and how to validate** at each phase. Each phase should feel like a complete, usable product-not a half-step.

---

### Phase 1 - MVP (Individual User)

**Goal:** Make users come back **every day** without feeling overwhelmed.

**Primary Question:**

> "Can this app become part of my daily routine|"

**What to Build (Instructional):**

- Implement **Today Screen as the only primary navigation**
- Allow users to:
  - Add tasks quickly
  - Mark tasks as done / skipped / delayed
- Introduce **Add Habit** as an optional path (not forced)
- Reminders:
  - Email only
  - Positioned as _gentle nudges_, not alarms
- Finance:
  - Manual account setup
  - Manual transaction input (income/expense only)
  - No analytics yet
- Gamification:
  - Points + daily streak only
  - No achievements, no levels

**What to Explicitly Avoid:**

- Too many charts
- Too many settings
- Any AI or prediction

**Success Signals:**

- User opens app >=1x per day
- User completes at least 1 task or habit per day

---

### Phase 2 - Power User & Retention

**Goal:** Help users **see progress and meaning** over time.

**Primary Question:**

> "Am I actually improving|"

**What to Build (Instructional):**

- Introduce **Weekly & Monthly Review screens**:
  - Task completion trends
  - Habit consistency
  - Missed vs recovered days
- Gamification expansion:
  - Achievements tied to real behavior (e.g. recovery, consistency)
  - Levels as milestones, not grind targets
- Habit fatigue control:
  - Soft recommendation to limit active habits
- Finance improvements:
  - Recurring transactions (flexible schedules, reminder-first)
  - Smart defaults (last used account/category)
  - Subscription tracker (renewal dates, trial tracking, gentle reminders)

**What to Explicitly Avoid:**

- Punitive language for missed habits
- Infinite habit creation without guidance

**Success Signals:**

- Users check review screens weekly
- Habit streaks last >14 days

---

### Phase 3 - Monetization & Commitment

**Goal:** Make users **willing to pay** because stopping feels like a loss.

**Primary Question:**

> "What do I lose if I stop using this app|"

**What to Build (Instructional):**

- Advanced analytics:
  - Habit <-> task <-> finance correlations
  - Historical comparisons (this month vs last month)
- Commitment-grade reminders:
  - Multiple reminder windows
  - Escalation logic (soft, never aggressive)
- Data ownership features:
  - Export (CSV / PDF summaries)
- Clear Pro boundaries:
  - Reviews, analytics, commitment tools behind paywall

**What to Explicitly Avoid:**

- Locking core planner behind paywall
- Dark patterns in reminders or pricing

**Success Signals:**

- Users upgrade after 30-60 days
- Pro users engage with analytics weekly

---

### Phase 4 - Life OS & Intelligence Layer

**Goal:** Become a **long-term personal companion**, not just a tool.

**Primary Question:**

> "Does this app understand me better over time|"

**What to Build (Instructional):**

- AI-assisted insights:
  - Natural language summaries (weekly/monthly)
  - Pattern detection (burnout, recovery cycles)
- Predictive but non-intrusive nudges:
  - Suggestions, never commands
- Explainability:
  - Every AI insight must reference underlying data

**What to Explicitly Avoid:**

- Black-box AI decisions
- Auto-actions without user consent

**Success Signals:**

- Users read AI summaries
- Users feel insights are _accurate and respectful_

AI is **assistive**, not authoritative. The system remains user-controlled.

---

## 8. Finalized Design Decisions (v1)

- Task vs Habit UX:
  - `+ Add` -> **Add Task / Add Habit** (UX distinction only)
  - Single schema (`tasks` + `repeat_rules`)
- Reminder:
- Email first (reliable, default)
- Browser push via PWA (optional)

Reminder behavior (MVP):

- Best-effort delivery
- Manual confirmation by user
- Auto-expire at logical day end if no action
- Balance strategy: User inputs opening balance, system maintains current balance
- Gamification:
  - Points **habit-only** (no points for one-off tasks)
  - Daily cap
  - Streak per day (based on habit completion)

---

## 10. API Contract (Supabase-Ready, Scalable)

> API is designed as **BFF-style (Backend For Frontend)**.
>
> The Next.js app calls either:
>
> - **Supabase client directly** (RLS enforced) for simple CRUD, or
> - **Next.js Route Handlers** (`/api/*`) for privileged workflows (end-of-day resolution, reminder dispatching, snapshots, exports).
>
> All responses are JSON. All writes are scoped to the authenticated user.

### 10.0 Versioning & Stability (Recommended)

To keep the API evolvable without breaking clients:

- Prefer path versioning: `/api/v1/...`
- Or header versioning: `x-api-version: 1`

Stability rules:

- No breaking changes within a major version
- Additive fields are allowed
- Deprecations must be documented (Phase 3+)

### 10.1 Principles

- **Auth:** Supabase Auth (JWT)
- **Authorization:** RLS on every table; server routes must re-check `user_id`
- **Idempotency:** write endpoints require `idempotency_key` (client-generated UUID) for retry safety
- **Pagination:** cursor-based for large lists (`limit`, `cursor`)
- **Filtering & Sorting:** list endpoints accept `q`, `status`, `from`, `to`, `sort` (Phase 2+)
- **Time:** server resolves `logical_day` consistently from user timezone

#### Standard Response Envelope (Recommended)

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "next_cursor": "string|null"
  }
}
```

#### Standard Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be > 0",
    "details": {},
    "request_id": "uuid"
  }
}
```

Common codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

### 10.2 Data Access Strategy

- **Direct Supabase (client):** tasks, notes, transactions read (no client writes)
- **Server API routes:**
  - Transaction creation (atomic balance updates, idempotent)
  - End-of-day resolution
  - Reminder scheduling & dispatch
  - Snapshot generation
  - Exports & reporting (Phase 3)
  - Future AI summaries (Phase 4)

### 10.2.1 Rate Limiting & Abuse Protection (Phase 1 minimal)

- Apply lightweight rate limits to write endpoints (e.g., 60 req/min/user)
- Stronger limits on system endpoints (`/api/system/*`)

### 10.2.2 Idempotency Storage (Phase 1)

For reliable retries across networks, use a small store:

- `idempotency_keys` table with `{user_id, key, endpoint, response_hash, created_at}`
- Server routes return the stored result on duplicate requests

### 10.3 Domain: Tasks & Today

#### GET /api/v1/today|date=YYYY-MM-DD

Returns Today payload resolved to user `logical_day`.

```json
{
  "data": {
    "logical_day": "2026-01-14",
    "timezone": "Asia/Jakarta",
    "tasks": [
      {
        "task_instance_id": "uuid",
        "task_id": "uuid",
        "title": "Pay rent",
        "scheduled_at": "2026-01-14T09:00:00+07:00",
        "status": "pending",
        "is_habit": true,
        "note_id": "uuid|null"
      }
    ],
    "summary": {
      "tasks_done": 3,
      "habits_done": 1,
      "money_in": 0,
      "money_out": 250000
    }
  },
  "meta": { "request_id": "uuid", "next_cursor": null }
}
```

#### GET /api/v1/tasks|from=YYYY-MM-DD&to=YYYY-MM-DD&status=pending&limit=50&cursor=...

List tasks/instances by date range (Phase 2+). Useful for calendar views.

#### POST /api/v1/tasks

Create a task (one-off or template).

```json
{
  "title": "Meeting with team",
  "description": "Discuss roadmap",
  "scheduled_at": "2026-01-15T10:00:00+07:00",
  "note_id": null,
  "is_template": false,
  "idempotency_key": "uuid"
}
```

#### PATCH /api/v1/tasks/:id

Update task fields (title/description/scheduled_at/note_id).

#### PATCH /api/v1/task-instances/:id

Update status of a task instance.

```json
{
  "status": "done",
  "confirmed_at": "2026-01-14T20:10:00+07:00",
  "idempotency_key": "uuid"
}
```

Rules:

- `done` awards points only if the task is a habit (has repeat rule)
- `delayed` moves instance to the next available `logical_day`
- `skipped` may be explicit (user) or system (end-of-day)

#### DELETE /api/v1/tasks/:id

Soft-delete recommended (Phase 2+) to preserve analytics integrity.

### 10.4 Domain: Habits (Repeat Rules)

#### POST /api/v1/habits

Creates a habit via a task template + repeat rule + reminder defaults.

```json
{
  "title": "Read 20 minutes",
  "description": "",
  "rule_type": "daily",
  "rule_config": { "time": "21:00" },
  "reminder": { "channel": "email", "time": "21:00" },
  "idempotency_key": "uuid"
}
```

#### GET /api/v1/habits|limit=50&cursor=...

List habit templates.

#### PATCH /api/v1/habits/:task_id

Update repeat rule / reminder settings.

#### POST /api/v1/habits/:task_id/pause

Pause a habit (Phase 2+). Does not delete history.

#### POST /api/v1/habits/:task_id/resume

Resume a habit (Phase 2+).

### 10.5 Domain: Notes

#### POST /api/v1/notes

Create a note (blank or template).

```json
{
  "title": "Bills - January",
  "template_type": "billing",
  "content": { "blocks": [], "checklist": [] },
  "idempotency_key": "uuid"
}
```

#### GET /api/v1/notes|template_type=billing&q=bills&limit=50&cursor=...

List notes (Phase 1 supports basic list; Phase 2 adds filtering/search).

#### GET /api/v1/notes/:id

Read note detail.

#### PATCH /api/v1/notes/:id

Update title/content.

#### POST /api/v1/notes/:id/convert-to-task

Convert a note checklist item into a task.

```json
{
  "checklist_item_id": "uuid",
  "scheduled_at": "2026-01-14T09:00:00+07:00",
  "idempotency_key": "uuid"
}
```

Effect:

- Creates `tasks` row
- Creates `task_instances` for the scheduled logical day
- Links task <-> note (via `note_id` or `notes_task_links`)

### 10.6 Domain: Finance

#### POST /api/v1/accounts

Create money account.

```json
{
  "name": "BCA",
  "type": "bank",
  "opening_balance": 1500000,
  "currency_code": "IDR",
  "icon": "landmark",
  "idempotency_key": "uuid"
}
```

#### GET /api/v1/accounts

List accounts and balances.

#### GET /api/v1/categories|type=expense

List transaction categories (scoped by type).

#### POST /api/v1/categories

Create transaction category.

```json
{
  "name": "Food & Dining",
  "type": "expense",
  "icon": "utensils",
  "idempotency_key": "uuid"
}
```

#### POST /api/v1/subscriptions (Phase 2+)

Create a subscription tracker item.

```json
{
  "provider": "Spotify",
  "amount": 65000,
  "currency_code": "IDR",
  "cadence": "monthly",
  "next_charge_at": "2026-02-01T09:00:00+07:00",
  "status": "active",
  "trial_end_at": null,
  "idempotency_key": "uuid"
}
```

Behavior:

- Generates a **draft transaction** when due (user confirms)
- If status is `paused` or `cancelled`, no drafts are generated

#### POST /api/v1/transactions

Create transaction and update balances atomically.

```json
{
  "type": "expense",
  "from_account_id": "uuid",
  "to_account_id": null,
  "amount": 250000,
  "category": "Food & Dining",
  "description": "Pay rent",
  "task_instance_id": "uuid|null",
  "note_id": "uuid|null",
  "idempotency_key": "uuid"
}
```

Rules:

- Updates `current_balance` on affected accounts
- `currency_code` is resolved from the account and stored on the transaction
- UI totals and summaries are grouped by currency; no conversion in Phase 1
- Phase 1: allow negative balances with a soft warning (no hard block)
- Phase 1: `type` supports `income` and `expense` only; `transfer` and `investment` are Phase 2

#### GET /api/v1/transactions|from=YYYY-MM-DD&to=YYYY-MM-DD&type=expense&account_id=...&limit=50&cursor=...

Paginated transaction history.

#### POST /api/v1/transactions/:id/reconcile

Admin/self reconcile action (Phase 3+), logs to audit.

### 10.7 System Jobs (Server-only)

These endpoints are invoked by scheduled jobs (cron) and must be protected.

#### POST /api/v1/system/end-of-day

Runs end-of-day resolution for a given logical day.

```json
{
  "logical_day": "2026-01-14",
  "dry_run": false
}
```

Actions:

- Marks unconfirmed habit instances as `skipped`
- Moves delayed tasks
- Generates `daily_snapshots`

#### POST /api/v1/system/reminders/run

Runs reminder dispatching window.

```json
{
  "window_start": "2026-01-14T20:55:00+07:00",
  "window_end": "2026-01-14T21:05:00+07:00"
}
```

Reminder reliability notes (Phase 1):

- Best-effort delivery
- Retries may be introduced later (Phase 2+)

### 10.8 Security, Auditing, Observability

- RLS policies on all user tables (`user_id = auth.uid()`)
- Audit logs for sensitive changes (finance edits, reconciliations, exports)
- Request IDs in responses for debugging
- Log minimal metadata (no sensitive content in logs)

---

## 10.10 Scalability Notes & Decisions (Keep in PRD)

This section captures **important implementation notes** so the product remains scalable across Phase 1-4.

### A) Client Direct vs Server Route Matrix (Recommended)

**Client Direct (Supabase JS, RLS-only):**

- Create/update/read tasks (simple CRUD)
- Create/update/read notes (simple CRUD)
- Read transactions (list/detail)

**Server Routes (/api/v1, privileged workflows):**

- End-of-day resolution (auto-skip, delay move, snapshots)
- Reminder scheduling & sending
- Create transactions (atomic balance updates, idempotent)
- Exports (CSV/PDF), reconciliation actions
- Future AI summaries / insights

**Rule of thumb:** if an action touches **multiple tables** or needs **atomicity**, use server routes.

---

### B) RLS Minimum Policy Checklist (Supabase)

Apply RLS to every user-scoped table:

- `profiles`, `tasks`, `task_instances`, `repeat_rules`, `reminders`, `notes`, `notes_task_links`, `money_accounts`, `transaction_categories`, `transactions`, `daily_snapshots`, `gamification_stats`, `point_logs`, `reminder_deliveries`, `audit_logs`, `idempotency_keys`

Minimum policy pattern:

- SELECT/INSERT/UPDATE/DELETE allowed only when `user_id = auth.uid()`

Server routes must still verify the authenticated user and never accept `user_id` from client.

---

### C) Cron & Scheduling (Supabase / Vercel)

**End-of-day job**

- Runs once per user timezone and resolves the logical day.
- Generates `daily_snapshots` deterministically.

**Reminder job**

- Runs every 5 minutes (or 10 minutes) and dispatches reminders within the window.
- Best-effort in Phase 1; add retries + delivery logs in Phase 2.

Protection:

- `/api/v1/system/*` requires a secret (cron token) + server-only enforcement.

---

### D) Reminder Delivery Strategy (Practical)

Phase 1 (simple & reliable):

- Email only
- Reminder = nudge

Phase 2+:

- Add delivery logs (`reminder_deliveries`) and retry on failure.
- Add PWA push (optional) for installed users.

Avoid promising alarm-grade reliability until retries & delivery logs exist.

---

### E) Finance Consistency Strategy (Important)

Recommended approach:

- Treat `transactions` as the source of truth.
- `money_accounts.current_balance` is a cache for fast UI.
- Update balances **atomically** when creating transactions (server route required in Phase 1).
- Balance audit (P3+): recalculate per account, show delta, and resolve via an **adjustment transaction** (server-only, idempotent, logged in `audit_logs`).

Reconciliation:

- Phase 3+: introduce reconcile action and audit it.

Edits:

- Prefer immutable transactions (edit creates adjustment) in Phase 3+.

---

### F) Deletion & History Integrity

- Prefer **soft delete** for tasks/habits/notes to preserve analytics.
- Never delete finance transactions in Pro phase; use adjustments.

---

### G) Observability & Audit

- Include `request_id` in every response.
- Log minimal metadata (endpoint, duration, success/failure).
- Audit sensitive actions:
  - transaction edits/reconciliations
  - exports
  - reminder settings changes

---

### H) API Evolution

- Keep all new fields additive.
- Use `/api/v1` path versioning.
- Document deprecated endpoints before removal.

---

### I) Data Import/Export (Phase 3+)

- Export: tasks/habits summaries + finance CSV.
- Import: optional CSV import for transactions (later).

---

Reconciliation:

- Phase 3+: introduce reconcile action and audit it.

Edits:

- Prefer immutable transactions (edit creates adjustment) in Phase 3+.

---

### F) Deletion & History Integrity

- Prefer **soft delete** for tasks/habits/notes to preserve analytics.
- Never delete finance transactions in Pro phase; use adjustments.

---

### G) Observability & Audit

- Include `request_id` in every response.
- Log minimal metadata (endpoint, duration, success/failure).
- Audit sensitive actions:
  - transaction edits/reconciliations
  - exports
  - reminder settings changes

---

### H) API Evolution

- Keep all new fields additive.
- Use `/api/v1` path versioning.
- Document deprecated endpoints before removal.

---

### I) Data Import/Export (Phase 3+)

- Export: tasks/habits summaries + finance CSV.
- Import: optional CSV import for transactions (later).

---

### J) Open Questions (Remaining)

- Whether to store `point_logs` in Phase 2 or Phase 3

---

### K) Deployment Checklist

> [!CAUTION] > **BELUM SELESAI:** Pastikan setup berikut sudah dilakukan sebelum production!

#### Environment Variables (Required)

```env
CRON_SECRET=your-secure-random-string
RESEND_API_KEY=re_your_api_key  # Optional, untuk email reminders
```

#### GitHub Actions Secrets

Jika menggunakan GitHub Actions untuk cron jobs, tambahkan secrets di repo:

1. `APP_URL` - URL aplikasi yang di-deploy (e.g., `https://orbit.vercel.app`)
2. `CRON_SECRET` - Sama dengan value di environment variables

#### Cron Jobs Setup

File workflow sudah dibuat di `.github/workflows/cron-jobs.yml`:

| Job        | Schedule           | Endpoint                       |
| ---------- | ------------------ | ------------------------------ |
| End of Day | 11:59 PM UTC daily | `/api/v1/system/end-of-day`    |
| Reminders  | Every 15 minutes   | `/api/v1/system/reminders/run` |

**Untuk Vercel:** Tambahkan `vercel.json` dengan konfigurasi crons.

**Testing manual:**

```bash
curl -X POST https://your-app.vercel.app/api/v1/system/end-of-day \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---
