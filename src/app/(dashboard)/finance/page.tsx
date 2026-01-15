'use client';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/finance/AddTransactionSheet';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useAccounts } from '@/hooks/use-accounts';
import { format } from 'date-fns';

export default function FinancePage() {
  const { data: user } = useUser();
  const { data: accounts } = useAccounts();
  const supabase = createClient();

  // Fetch transactions for current month
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalBalance =
    accounts?.reduce(
      (acc: number, curr: any) => acc + (curr.current_balance || 0),
      0
    ) || 0;

  // Calculate this month's spend
  // Note: For MVP, just summing loaded transactions (which are 20 defaults).
  // Ideally, should make a separate aggregation query.
  // For now, let's filter the local list (rough approximation if list < 20).
  // A better way is a dedicated RPC or query for "Monthly Spend".
  // I will compute from loaded transactions for now to show interaction.
  // Wait, if I only load 20, the "Monthly Spent" will be wrong if > 20 txs.
  // I'll leave it as "Recent Activity" focused, and just sum visible for now or 0.
  // Actually, I can use a simpler approach: `sum(amount)` where type=expense and date > first of month.

  const { data: monthlystats } = useQuery({
    queryKey: ['finance_stats'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { spent: 0 };
      const startOfMonth = format(new Date(), 'yyyy-MM-01');

      // Spending
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('logical_day', startOfMonth);

      const spent =
        data?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      return { spent };
    },
  });

  return (
    <div className="flex flex-col space-y-8 pb-20 animate-fade-up">
      {/* Header */}
      <header className="flex flex-col space-y-1 pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Financial Health
        </h1>
        <p className="text-muted-foreground text-sm">
          Track expenses and income with confidence.
        </p>
      </header>

      {/* Summary Cards with Add Action */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Balance
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-primary">
              $
              {totalBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="p-5 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm shadow-sm flex flex-col justify-between h-32 hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                Spent Month
              </span>
            </div>
            <div className="text-2xl font-bold font-mono tracking-tight text-destructive">
              $
              {monthlystats?.spent?.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              }) || '0.00'}
            </div>
          </div>
        </div>

        <AddTransactionSheet>
          <button className="w-full py-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
            <Plus size={16} />
            Log New Transaction
          </button>
        </AddTransactionSheet>
      </div>

      {/* Transactions */}
      <section className="space-y-4 animate-fade-up-delay-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h3>
        </div>

        <div className="flex flex-col space-y-3">
          {isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              Loading transactions...
            </div>
          )}

          {transactions?.map((tx: any) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border',
                    tx.amount > 0 && tx.type === 'income' // actually amount is absolute in logic but stored as positive? check check constraint. amount > 0. type determines sign.
                      ? // My logic above stored absolute.
                        // But typically I prefer negative for expense in UI.
                        // Let's rely on Type.
                        'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  )}
                >
                  {tx.type === 'income' ? (
                    <ArrowDownLeft size={18} /> /* Income comes IN */
                  ) : (
                    <ArrowUpRight size={18} /> /* Expense goes OUT */
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-foreground">
                    {tx.description || tx.category || 'Untitled'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'font-mono font-medium text-sm',
                  tx.type === 'income' ? 'text-emerald-600' : 'text-foreground'
                )}
              >
                {tx.type === 'income' ? '+' : '-'}$
                {Number(tx.amount).toFixed(2)}
              </div>
            </div>
          ))}

          {transactions?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-white/10 rounded-xl">
              No transactions yet. Start tracking!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
