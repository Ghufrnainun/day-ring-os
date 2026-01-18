-- Finance: multi-currency accounts, account icons, and user categories

ALTER TABLE public.money_accounts
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD';

CREATE TABLE IF NOT EXISTS public.transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, type, name)
);

ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own categories" ON public.transaction_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own categories" ON public.transaction_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.transaction_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.transaction_categories FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_user_type
  ON public.transaction_categories(user_id, type);

-- Ensure a default wallet exists for the user
CREATE OR REPLACE FUNCTION public.ensure_default_wallet(target_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wallet_id UUID;
BEGIN
  IF target_user_id IS NULL OR target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT id INTO wallet_id
  FROM public.money_accounts
  WHERE user_id = target_user_id AND type = 'cash' AND deleted_at IS NULL
  LIMIT 1;

  IF wallet_id IS NULL THEN
    INSERT INTO public.money_accounts (
      user_id,
      name,
      type,
      opening_balance,
      current_balance,
      currency_code,
      icon
    )
    VALUES (target_user_id, 'Cash Wallet', 'cash', 0, 0, 'USD', 'wallet')
    RETURNING id INTO wallet_id;
  END IF;

  RETURN wallet_id;
END;
$$;

-- Ensure default categories exist for the user
CREATE OR REPLACE FUNCTION public.ensure_default_categories(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF target_user_id IS NULL OR target_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.transaction_categories
    WHERE user_id = target_user_id AND deleted_at IS NULL
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.transaction_categories (user_id, name, type)
  VALUES
    (target_user_id, 'Food & Dining', 'expense'),
    (target_user_id, 'Transport', 'expense'),
    (target_user_id, 'Shopping', 'expense'),
    (target_user_id, 'Bills', 'expense'),
    (target_user_id, 'Health', 'expense'),
    (target_user_id, 'Entertainment', 'expense'),
    (target_user_id, 'Other', 'expense'),
    (target_user_id, 'Salary', 'income'),
    (target_user_id, 'Freelance', 'income'),
    (target_user_id, 'Gift', 'income'),
    (target_user_id, 'Refund', 'income'),
    (target_user_id, 'Other', 'income');
END;
$$;

-- Create account with idempotency
CREATE OR REPLACE FUNCTION public.create_money_account_atomic(
  p_user_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_opening_balance NUMERIC,
  p_currency_code TEXT,
  p_icon TEXT,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_currency TEXT;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_idempotency_key IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_idempotency_key');
  END IF;

  IF p_type NOT IN ('bank', 'cash', 'ewallet', 'investment') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_account_type');
  END IF;

  SELECT 1 FROM public.idempotency_keys
  WHERE user_id = p_user_id AND key = p_idempotency_key AND endpoint = 'accounts';

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  v_currency := upper(COALESCE(NULLIF(trim(p_currency_code), ''), 'USD'));

  INSERT INTO public.money_accounts (
    user_id,
    name,
    type,
    opening_balance,
    current_balance,
    currency_code,
    icon
  )
  VALUES (
    p_user_id,
    p_name,
    p_type,
    COALESCE(p_opening_balance, 0),
    COALESCE(p_opening_balance, 0),
    v_currency,
    NULLIF(trim(p_icon), '')
  )
  RETURNING id INTO v_account_id;

  INSERT INTO public.idempotency_keys (user_id, key, endpoint, response_hash)
  VALUES (p_user_id, p_idempotency_key, 'accounts', md5(v_account_id::text));

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'currency_code', v_currency
  );
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create category with idempotency
CREATE OR REPLACE FUNCTION public.create_transaction_category_atomic(
  p_user_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_icon TEXT,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_id UUID;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_idempotency_key IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_idempotency_key');
  END IF;

  IF p_type NOT IN ('income', 'expense') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_category_type');
  END IF;

  SELECT id INTO v_category_id
  FROM public.transaction_categories
  WHERE user_id = p_user_id
    AND type = p_type
    AND lower(name) = lower(p_name)
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_category_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'category_id', v_category_id, 'duplicate', true);
  END IF;

  SELECT 1 FROM public.idempotency_keys
  WHERE user_id = p_user_id AND key = p_idempotency_key AND endpoint = 'categories';

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  INSERT INTO public.transaction_categories (user_id, name, type, icon)
  VALUES (
    p_user_id,
    trim(p_name),
    p_type,
    NULLIF(trim(p_icon), '')
  )
  RETURNING id INTO v_category_id;

  INSERT INTO public.idempotency_keys (user_id, key, endpoint, response_hash)
  VALUES (p_user_id, p_idempotency_key, 'categories', md5(v_category_id::text));

  RETURN jsonb_build_object('success', true, 'category_id', v_category_id);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create transaction with idempotency + currency resolution
CREATE OR REPLACE FUNCTION public.create_transaction_atomic(
  p_user_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_category TEXT,
  p_description TEXT,
  p_logical_day DATE,
  p_account_id UUID,
  p_idempotency_key UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_currency TEXT;
  v_balance NUMERIC;
  v_is_overdrawn BOOLEAN := false;
BEGIN
  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF p_idempotency_key IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_idempotency_key');
  END IF;

  IF p_type NOT IN ('income', 'expense') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_type');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_amount');
  END IF;

  IF p_logical_day IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'missing_logical_day');
  END IF;

  SELECT 1 FROM public.idempotency_keys
  WHERE user_id = p_user_id AND key = p_idempotency_key AND endpoint = 'transactions';

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true);
  END IF;

  SELECT current_balance, currency_code
  INTO v_balance, v_currency
  FROM public.money_accounts
  WHERE id = p_account_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  LIMIT 1;

  IF v_currency IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'account_not_found');
  END IF;

  IF p_type = 'expense' THEN
    v_is_overdrawn := (v_balance - p_amount) < 0;
    INSERT INTO public.transactions (
      user_id,
      from_account_id,
      amount,
      type,
      logical_day,
      description,
      category,
      currency_code
    )
    VALUES (
      p_user_id,
      p_account_id,
      p_amount,
      p_type,
      p_logical_day,
      NULLIF(trim(p_description), ''),
      NULLIF(trim(p_category), ''),
      v_currency
    )
    RETURNING id INTO v_transaction_id;
  ELSE
    v_is_overdrawn := (v_balance + p_amount) < 0;
    INSERT INTO public.transactions (
      user_id,
      to_account_id,
      amount,
      type,
      logical_day,
      description,
      category,
      currency_code
    )
    VALUES (
      p_user_id,
      p_account_id,
      p_amount,
      p_type,
      p_logical_day,
      NULLIF(trim(p_description), ''),
      NULLIF(trim(p_category), ''),
      v_currency
    )
    RETURNING id INTO v_transaction_id;
  END IF;

  INSERT INTO public.idempotency_keys (user_id, key, endpoint, response_hash)
  VALUES (p_user_id, p_idempotency_key, 'transactions', md5(v_transaction_id::text));

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'is_overdrawn', v_is_overdrawn
  );
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
