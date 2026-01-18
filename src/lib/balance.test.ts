import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Balance Calculation Tests
 *
 * Tests for finance balance calculations to ensure data integrity
 * for transactions, account balances, and atomic updates.
 */

// --- Pure functions for balance calculations ---

interface Transaction {
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  account_id: string;
  to_account_id?: string; // For transfers
}

interface Account {
  id: string;
  balance: number;
  allow_negative: boolean;
}

/**
 * Calculate new account balance after transaction
 */
function calculateNewBalance(
  currentBalance: number,
  transaction: Transaction,
  accountId: string,
): number {
  if (transaction.type === 'income') {
    return currentBalance + transaction.amount;
  } else if (transaction.type === 'expense') {
    return currentBalance - transaction.amount;
  } else if (transaction.type === 'transfer') {
    if (transaction.account_id === accountId) {
      // Source account - money goes out
      return currentBalance - transaction.amount;
    } else if (transaction.to_account_id === accountId) {
      // Destination account - money comes in
      return currentBalance + transaction.amount;
    }
  }
  return currentBalance;
}

/**
 * Validate if transaction would cause overdraft
 */
function wouldOverdraft(account: Account, transaction: Transaction): boolean {
  if (account.allow_negative) return false;

  if (
    transaction.type === 'expense' ||
    (transaction.type === 'transfer' && transaction.account_id === account.id)
  ) {
    return account.balance - transaction.amount < 0;
  }

  return false;
}

/**
 * Calculate total balance across multiple accounts
 */
function calculateTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + acc.balance, 0);
}

/**
 * Calculate monthly spend from transactions
 */
function calculateMonthlySpend(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate net flow (income - expense)
 */
function calculateNetFlow(transactions: Transaction[]): number {
  return transactions.reduce((net, t) => {
    if (t.type === 'income') return net + t.amount;
    if (t.type === 'expense') return net - t.amount;
    return net; // Transfers are zero-sum
  }, 0);
}

// --- Tests ---

describe('Balance Calculations', () => {
  describe('calculateNewBalance', () => {
    it('adds income to balance', () => {
      const result = calculateNewBalance(
        1000,
        {
          amount: 500,
          type: 'income',
          account_id: 'acc_1',
        },
        'acc_1',
      );

      expect(result).toBe(1500);
    });

    it('subtracts expense from balance', () => {
      const result = calculateNewBalance(
        1000,
        {
          amount: 300,
          type: 'expense',
          account_id: 'acc_1',
        },
        'acc_1',
      );

      expect(result).toBe(700);
    });

    it('handles transfer source account (debit)', () => {
      const result = calculateNewBalance(
        1000,
        {
          amount: 200,
          type: 'transfer',
          account_id: 'acc_1', // Source
          to_account_id: 'acc_2',
        },
        'acc_1',
      );

      expect(result).toBe(800);
    });

    it('handles transfer destination account (credit)', () => {
      const result = calculateNewBalance(
        500,
        {
          amount: 200,
          type: 'transfer',
          account_id: 'acc_1',
          to_account_id: 'acc_2', // Destination
        },
        'acc_2',
      );

      expect(result).toBe(700);
    });

    it('handles zero amount transactions', () => {
      const result = calculateNewBalance(
        1000,
        {
          amount: 0,
          type: 'expense',
          account_id: 'acc_1',
        },
        'acc_1',
      );

      expect(result).toBe(1000);
    });

    it('handles decimal amounts correctly', () => {
      const result = calculateNewBalance(
        100.5,
        {
          amount: 25.75,
          type: 'expense',
          account_id: 'acc_1',
        },
        'acc_1',
      );

      expect(result).toBeCloseTo(74.75, 2);
    });
  });

  describe('wouldOverdraft', () => {
    const strictAccount: Account = {
      id: 'acc_1',
      balance: 100,
      allow_negative: false,
    };

    const flexibleAccount: Account = {
      id: 'acc_2',
      balance: 100,
      allow_negative: true,
    };

    it('detects overdraft on strict account', () => {
      expect(
        wouldOverdraft(strictAccount, {
          amount: 150,
          type: 'expense',
          account_id: 'acc_1',
        }),
      ).toBe(true);
    });

    it('allows valid expense on strict account', () => {
      expect(
        wouldOverdraft(strictAccount, {
          amount: 50,
          type: 'expense',
          account_id: 'acc_1',
        }),
      ).toBe(false);
    });

    it('allows exact balance expense', () => {
      expect(
        wouldOverdraft(strictAccount, {
          amount: 100,
          type: 'expense',
          account_id: 'acc_1',
        }),
      ).toBe(false);
    });

    it('allows overdraft on flexible account', () => {
      expect(
        wouldOverdraft(flexibleAccount, {
          amount: 500,
          type: 'expense',
          account_id: 'acc_2',
        }),
      ).toBe(false);
    });

    it('income never causes overdraft', () => {
      expect(
        wouldOverdraft(strictAccount, {
          amount: 1000000,
          type: 'income',
          account_id: 'acc_1',
        }),
      ).toBe(false);
    });

    it('detects overdraft on transfer source', () => {
      expect(
        wouldOverdraft(strictAccount, {
          amount: 150,
          type: 'transfer',
          account_id: 'acc_1',
          to_account_id: 'acc_2',
        }),
      ).toBe(true);
    });
  });

  describe('calculateTotalBalance', () => {
    it('sums all account balances', () => {
      const accounts: Account[] = [
        { id: '1', balance: 1000, allow_negative: false },
        { id: '2', balance: 2500, allow_negative: false },
        { id: '3', balance: 500, allow_negative: false },
      ];

      expect(calculateTotalBalance(accounts)).toBe(4000);
    });

    it('handles negative balances', () => {
      const accounts: Account[] = [
        { id: '1', balance: 1000, allow_negative: false },
        { id: '2', balance: -200, allow_negative: true },
      ];

      expect(calculateTotalBalance(accounts)).toBe(800);
    });

    it('returns 0 for empty accounts', () => {
      expect(calculateTotalBalance([])).toBe(0);
    });
  });

  describe('calculateMonthlySpend', () => {
    it('sums only expenses', () => {
      const transactions: Transaction[] = [
        { amount: 100, type: 'expense', account_id: '1' },
        { amount: 500, type: 'income', account_id: '1' },
        { amount: 75, type: 'expense', account_id: '1' },
        { amount: 200, type: 'transfer', account_id: '1', to_account_id: '2' },
      ];

      expect(calculateMonthlySpend(transactions)).toBe(175);
    });

    it('returns 0 when no expenses', () => {
      const transactions: Transaction[] = [
        { amount: 500, type: 'income', account_id: '1' },
      ];

      expect(calculateMonthlySpend(transactions)).toBe(0);
    });
  });

  describe('calculateNetFlow', () => {
    it('calculates income minus expenses', () => {
      const transactions: Transaction[] = [
        { amount: 100, type: 'expense', account_id: '1' },
        { amount: 500, type: 'income', account_id: '1' },
        { amount: 50, type: 'expense', account_id: '1' },
      ];

      expect(calculateNetFlow(transactions)).toBe(350); // 500 - 100 - 50
    });

    it('ignores transfers (zero-sum)', () => {
      const transactions: Transaction[] = [
        { amount: 1000, type: 'transfer', account_id: '1', to_account_id: '2' },
      ];

      expect(calculateNetFlow(transactions)).toBe(0);
    });

    it('handles negative net flow', () => {
      const transactions: Transaction[] = [
        { amount: 100, type: 'income', account_id: '1' },
        { amount: 300, type: 'expense', account_id: '1' },
      ];

      expect(calculateNetFlow(transactions)).toBe(-200);
    });
  });
});

describe('Idempotency', () => {
  /**
   * Mock idempotency check logic
   */
  const processedKeys = new Set<string>();

  function isIdempotent(
    userId: string,
    key: string,
    endpoint: string,
  ): boolean {
    const compositeKey = `${userId}:${key}:${endpoint}`;
    if (processedKeys.has(compositeKey)) {
      return true; // Already processed
    }
    processedKeys.add(compositeKey);
    return false;
  }

  beforeEach(() => {
    processedKeys.clear();
  });

  it('first request is not idempotent', () => {
    expect(isIdempotent('user_1', 'key_abc', 'transactions')).toBe(false);
  });

  it('second identical request is idempotent', () => {
    isIdempotent('user_1', 'key_abc', 'transactions');
    expect(isIdempotent('user_1', 'key_abc', 'transactions')).toBe(true);
  });

  it('different key is not idempotent', () => {
    isIdempotent('user_1', 'key_abc', 'transactions');
    expect(isIdempotent('user_1', 'key_xyz', 'transactions')).toBe(false);
  });

  it('different endpoint is not idempotent', () => {
    isIdempotent('user_1', 'key_abc', 'transactions');
    expect(isIdempotent('user_1', 'key_abc', 'accounts')).toBe(false);
  });

  it('different user is not idempotent', () => {
    isIdempotent('user_1', 'key_abc', 'transactions');
    expect(isIdempotent('user_2', 'key_abc', 'transactions')).toBe(false);
  });
});
