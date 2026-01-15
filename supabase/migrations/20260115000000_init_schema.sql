-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    timezone TEXT DEFAULT 'UTC',
    avatar_url TEXT,
    active_modules JSONB DEFAULT '{"planner": true, "habits": false, "finance": false}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user 1()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. TASKS (Core Definitions)
CREATE TABLE public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ, -- For one-off scheduled tasks
    is_template BOOLEAN DEFAULT FALSE, -- If true, used for habits
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);


-- 3. TASK INSTANCES (Daily Execution)
CREATE TABLE public.task_instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Added for easier RLS and querying
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped', 'delayed')),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_instances_date ON public.task_instances(user_id, date);

ALTER TABLE public.task_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own instances" ON public.task_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own instances" ON public.task_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own instances" ON public.task_instances FOR UPDATE USING (auth.uid() = user_id);


-- 4. REPEAT RULES (Habit Engine)
CREATE TABLE public.repeat_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID UNIQUE REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Added for RLS
    rule_type TEXT NOT NULL CHECK (rule_type IN ('daily', 'weekly', 'custom')),
    rule_config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.repeat_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rules" ON public.repeat_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own rules" ON public.repeat_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.repeat_rules FOR UPDATE USING (auth.uid() = user_id);


-- 5. REMINDERS
CREATE TABLE public.reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Added for RLS
    channel TEXT NOT NULL CHECK (channel IN ('push', 'email')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);


-- 6. GAMIFICATION STATS
CREATE TABLE public.gamification_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_streak_date DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gamification_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own stats" ON public.gamification_stats FOR SELECT USING (auth.uid() = user_id);
-- Updates usually handled by server functions, but user check needed
CREATE POLICY "Users can update own stats" ON public.gamification_stats FOR UPDATE USING (auth.uid() = user_id);


-- 7. MONEY ACCOUNTS
CREATE TABLE public.money_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'ewallet', 'investment')),
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.money_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accounts" ON public.money_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON public.money_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.money_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.money_accounts FOR DELETE USING (auth.uid() = user_id);


-- 8. TRANSACTIONS
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    from_account_id UUID REFERENCES public.money_accounts(id),
    to_account_id UUID REFERENCES public.money_accounts(id),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
    description TEXT,
    category TEXT,
    task_instance_id UUID REFERENCES public.task_instances(id),
    -- note_id FK added below after tables created
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_transactions_user_created ON public.transactions(user_id, created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);


-- 9. DAILY SNAPSHOTS
CREATE TABLE public.daily_snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    tasks_done INTEGER DEFAULT 0,
    money_in NUMERIC DEFAULT 0,
    money_out NUMERIC DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own snapshots" ON public.daily_snapshots FOR SELECT USING (auth.uid() = user_id);


-- 10. AUDIT LOGS
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 11. NOTES
CREATE TABLE public.notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    template_type TEXT CHECK (template_type IN ('blank', 'meeting', 'weekly', 'billing', 'project')),
    content JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);


-- 12. NOTES TASK LINKS
CREATE TABLE public.notes_task_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(note_id, task_id)
);

ALTER TABLE public.notes_task_links ENABLE ROW LEVEL SECURITY;
-- No explicit RLS needed if accessed via joins, but good to add for direct access
CREATE POLICY "Users can access via note ownership" ON public.notes_task_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.notes WHERE id = note_id AND user_id = auth.uid())
);


-- 13. Late Binding Foreign Keys
ALTER TABLE public.transactions ADD COLUMN note_id UUID REFERENCES public.notes(id);


-- 14. Updated At Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notes_modtime BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_accounts_modtime BEFORE UPDATE ON public.money_accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_gamification_modtime BEFORE UPDATE ON public.gamification_stats FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 15. POINT LOGS (Phase 2: Detailed History)
CREATE TABLE public.point_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'habit_done', 'streak_bonus'
    task_instance_id UUID REFERENCES public.task_instances(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own point logs" ON public.point_logs FOR SELECT USING (auth.uid() = user_id);
-- Append-only system log, usually no insert/update from client directly, but we allow SELECT.


-- 16. IDEMPOTENCY KEYS (Phase 2: Reliability)
CREATE TABLE public.idempotency_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    key TEXT NOT NULL,
    request_method TEXT,
    request_path TEXT,
    response_code INTEGER,
    response_body JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, key)
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own keys" ON public.idempotency_keys FOR SELECT USING (auth.uid() = user_id);


-- 17. REMINDER DELIVERIES (Phase 2: Debugging & History)
CREATE TABLE public.reminder_deliveries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reminder_id UUID REFERENCES public.reminders(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed', 'queued'
    sent_at TIMESTAMPTZ DEFAULT now(),
    error_message TEXT
);

ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own delivery logs" ON public.reminder_deliveries FOR SELECT USING (auth.uid() = user_id);

-- 18. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_deleted ON public.tasks(user_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_task_instances_task_id ON public.task_instances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON public.task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_date_status ON public.task_instances(date, status);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_money_accounts_user_id ON public.money_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_snapshots_user_date ON public.daily_snapshots(user_id, date);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_template_type ON public.notes(template_type);

CREATE INDEX IF NOT EXISTS idx_repeat_rules_task_id ON public.repeat_rules(task_id);

CREATE INDEX IF NOT EXISTS idx_reminders_task_id ON public.reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON public.reminders(scheduled_at) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
