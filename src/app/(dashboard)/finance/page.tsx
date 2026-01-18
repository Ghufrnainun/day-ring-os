'use client';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Building2,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/finance/AddTransactionSheet';
import { AddAccountSheet } from '@/components/dashboard/finance/AddAccountSheet';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useAccounts } from '@/hooks/use-accounts';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionSkeleton } from '@/components/ui/skeletons';

const ACCOUNT_TYPE_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  cash: Wallet,
  bank: Building2,
  ewallet: Smartphone,
  investment: TrendingUp,
};

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  cash: 'bg-emerald-100 text-emerald-600',
  bank: 'bg-blue-100 text-blue-600',
  ewallet: 'bg-purple-100 text-purple-600',
  investment: 'bg-amber-100 text-amber-600',
};

export default function FinancePage() {
  const { data: user } = useUser();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
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

  // Calculate total balance
  const totalBalance =
    accounts?.reduce(
      (acc: number, curr: any) => acc + (curr.current_balance || 0),
      0,
    ) || 0;

  const { data: monthlyStats } = useQuery({
    queryKey: ['finance_stats'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { spent: 0, income: 0 };
      const startOfMonth = format(new Date(), 'yyyy-MM-01');

      const [expenseResult, incomeResult] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('logical_day', startOfMonth),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'income')
          .gte('logical_day', startOfMonth),
      ]);

      const spent =
        expenseResult.data?.reduce(
          (acc, curr) => acc + Number(curr.amount),
          0,
        ) || 0;
      const income =
        incomeResult.data?.reduce(
          (acc, curr) => acc + Number(curr.amount),
          0,
        ) || 0;
      return { spent, income };
    },
  });

  return (
    <div className="flex flex-col space-y-6 pb-24 max-w-2xl mx-auto animate-page-enter">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          Financial Health
        </h1>
        <p className="text-sm text-muted-foreground">
          Track expenses and income with confidence.
        </p>
      </header>

      {/* Summary Cards - Premium Glassmorphism */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/80 to-stone-50/60 border border-white/50 shadow-lg shadow-primary/5 backdrop-blur-sm overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          {/* Decorative gradient */}
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl" />

          <div className="relative flex items-center gap-2 text-muted-foreground mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Wallet size={14} className="text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Balance
            </span>
          </div>
          <div className="relative text-2xl font-bold font-mono tracking-tight text-primary">
            $
            {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-white/80 to-orange-50/40 border border-white/50 shadow-lg shadow-secondary/5 backdrop-blur-sm overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
          {/* Decorative gradient */}
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-full blur-xl" />

          <div className="relative flex items-center gap-2 text-muted-foreground mb-3">
            <div className="p-1.5 rounded-lg bg-secondary/10">
              <ArrowUpRight size={14} className="text-secondary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">
              Spent This Month
            </span>
          </div>
          <div className="relative text-2xl font-bold font-mono tracking-tight text-secondary">
            $
            {monthlyStats?.spent?.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            }) || '0.00'}
          </div>
        </div>
      </div>

      {/* Accounts Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Accounts
          </h3>
          <AddAccountSheet />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {accountsLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 p-4 rounded-2xl bg-white/60 border border-white/50 space-y-3"
                >
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </>
          )}

          {accounts?.map((account: any) => {
            const Icon = ACCOUNT_TYPE_ICONS[account.type] || Wallet;
            const colorClass =
              ACCOUNT_TYPE_COLORS[account.type] || 'bg-gray-100 text-gray-600';

            return (
              <div
                key={account.id}
                className="flex-shrink-0 w-44 p-4 rounded-2xl bg-gradient-to-br from-white/90 to-white/60 border border-white/60 shadow-md hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 group"
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-3',
                    colorClass,
                  )}
                >
                  <Icon size={16} />
                </div>
                <div className="text-sm font-semibold truncate">
                  {account.name}
                </div>
                <div className="text-lg font-bold font-mono text-primary mt-1">
                  $
                  {Number(account.current_balance || 0).toLocaleString(
                    'en-US',
                    { minimumFractionDigits: 2 },
                  )}
                </div>
              </div>
            );
          })}

          {accounts?.length === 0 && !accountsLoading && (
            <AddAccountSheet>
              <button className="flex-shrink-0 w-40 p-4 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                <Plus size={20} />
                <span className="text-xs">Add Account</span>
              </button>
            </AddAccountSheet>
          )}
        </div>
      </section>

      {/* Quick Add Transaction */}
      <AddTransactionSheet>
        <button className="w-full py-3.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
          <Plus size={16} />
          Log New Transaction
        </button>
      </AddTransactionSheet>

      {/* Transactions List */}
      <section className="space-y-4 animate-fade-up-delay-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Recent Activity
        </h3>

        <div className="flex flex-col space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <TransactionSkeleton key={i} />
              ))}
            </div>
          )}

          {transactions?.map((tx: any) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl bg-card/60 border border-border/30 hover:bg-card transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    tx.type === 'income'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary/10 text-secondary',
                  )}
                >
                  {tx.type === 'income' ? (
                    <ArrowDownLeft size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
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
                  tx.type === 'income' ? 'text-primary' : 'text-foreground',
                )}
              >
                {tx.type === 'income' ? '+' : '-'}$
                {Number(tx.amount).toFixed(2)}
              </div>
            </div>
          ))}

          {transactions?.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/30">
              No transactions yet. Start tracking!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
