-- ============================================
-- Part 1: Recurring Transactions
-- ============================================

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  -- Template fields
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT,
  description TEXT,
  from_account_id UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES money_accounts(id) ON DELETE SET NULL,
  
  -- Recurrence pattern (RFC 5545 RRULE)
  rrule TEXT NOT NULL, -- e.g., "FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=1"
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  next_occurrence DATE NOT NULL, -- Next date to generate transaction
  last_generated_date DATE, -- Last date we generated a transaction
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure at least one account is specified
  CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_recurring_tx_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tx_active_next 
  ON recurring_transactions(next_occurrence) 
  WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recurring transactions"
  ON recurring_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring transactions"
  ON recurring_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring transactions"
  ON recurring_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring transactions"
  ON recurring_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Part 2: Negative Balance Handling
-- ============================================

-- Add balance limit columns to money_accounts
ALTER TABLE money_accounts
ADD COLUMN IF NOT EXISTS balance_limit_mode TEXT DEFAULT 'soft' 
  CHECK (balance_limit_mode IN ('strict', 'soft', 'none')),
ADD COLUMN IF NOT EXISTS minimum_balance DECIMAL(12, 2) DEFAULT 0;

-- Set credit cards and loans to 'none' mode (no validation)
UPDATE money_accounts
SET balance_limit_mode = 'none'
WHERE account_type IN ('credit_card', 'loan');

-- Add index for accounts needing attention (soft warnings)
CREATE INDEX IF NOT EXISTS idx_accounts_low_balance 
  ON money_accounts(user_id, balance) 
  WHERE balance < minimum_balance AND balance_limit_mode != 'none';

-- ============================================
-- Part 3: Link Recurring Transactions to Generated Transactions
-- ============================================

-- Add optional link from transactions to their recurring template
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID 
  REFERENCES recurring_transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring 
  ON transactions(recurring_transaction_id) 
  WHERE recurring_transaction_id IS NOT NULL;

-- ============================================
-- Helper Function: Calculate Next Occurrence
-- ============================================

-- This will be used by the cron job to update next_occurrence
-- For now, we'll do this in application code using rrule library
-- PostgreSQL doesn't have built-in RRULE support
