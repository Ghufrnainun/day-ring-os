'use client';

import { useState, useTransition } from 'react';
import {
  DollarSign,
  ArrowDown,
  ArrowUp,
  Send,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createTransaction } from '@/actions/finance';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAccounts } from '@/hooks/use-accounts';
import { format, subDays, addDays, isToday, isFuture } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

interface QuickFinanceProps {
  dateString: string;
  className?: string;
}

/**
 * Quick Finance Log component for 30-second rule
 * Supports logging expense/income for today or past dates
 */
export function QuickFinance({ dateString, className }: QuickFinanceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(dateString));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  // Format the selected date for display
  const formattedDate = format(selectedDate, 'MMM d');
  const effectiveDateString = format(selectedDate, 'yyyy-MM-dd');

  // Quick date navigation
  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    const next = addDays(selectedDate, 1);
    if (!isFuture(next)) {
      setSelectedDate(next);
    }
  };

  const handleSubmit = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.info('Enter an amount to log');
      return;
    }
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    const numericAmount = Math.abs(parseFloat(amount));
    const idempotencyKey = crypto.randomUUID();

    startTransition(async () => {
      try {
        await createTransaction({
          amount: numericAmount,
          type,
          accountId,
          category: category || (type === 'expense' ? 'Other' : 'Income'),
          description: '',
          date: effectiveDateString,
          idempotencyKey,
        });

        const dateLabel = isToday(selectedDate) ? 'today' : formattedDate;
        toast.success(type === 'expense' ? 'Expense logged' : 'Income logged', {
          description: `${
            type === 'expense' ? '-' : '+'
          }$${numericAmount.toFixed(2)} on ${dateLabel}`,
          duration: 3000,
        });

        // Reset form
        setAmount('');
        setCategory('');
        setSelectedDate(new Date(dateString));
        setIsExpanded(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error?.message || 'Failed to log transaction');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setAmount('');
      setCategory('');
      setSelectedDate(new Date(dateString));
      setIsExpanded(false);
    }
  };

  // Common expense categories
  const expenseCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];
  const incomeCategories = ['Salary', 'Freelance', 'Gift', 'Other'];
  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-surface/40 hover:bg-surface/60 border border-border/50',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200 text-sm',
          className,
        )}
      >
        <DollarSign className="w-4 h-4" />
        <span>Log expense</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'p-4 rounded-xl bg-card border border-border/50 shadow-sm',
        'animate-fade-in space-y-4 pb-24 md:pb-4',
        className,
      )}
    >
      {/* Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setType('expense')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            type === 'expense'
              ? 'bg-red-500/10 text-red-500 border border-red-500/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted',
          )}
        >
          <ArrowDown className="w-4 h-4" />
          Expense
        </button>
        <button
          onClick={() => setType('income')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            type === 'income'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted',
          )}
        >
          <ArrowUp className="w-4 h-4" />
          Income
        </button>
      </div>

      {/* Amount Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0.00"
          autoFocus
          className={cn(
            'w-full pl-8 pr-4 py-3 rounded-lg',
            'bg-background border border-border/50',
            'text-lg font-medium text-foreground',
            'placeholder:text-muted-foreground/40',
            'focus:outline-none focus:ring-2 focus:ring-primary/30',
            pending && 'opacity-50',
          )}
        />
      </div>

      {/* Date Selector - Quick navigation for past dates */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={goToPreviousDay}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'min-w-[100px] h-8 px-3 text-sm font-medium',
                !isToday(selectedDate) && 'text-primary',
              )}
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              {isToday(selectedDate) ? 'Today' : formattedDate}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date && !isFuture(date)) {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }
              }}
              disabled={(date) => isFuture(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <button
          onClick={goToNextDay}
          disabled={isToday(selectedDate)}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            isToday(selectedDate)
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
          aria-label="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category & Account Row */}
      <div className="flex gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="flex-1 h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="flex-1 h-10">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            {accountsLoading ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : accounts && accounts.length > 0 ? (
              accounts.map((acc: any) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No accounts
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={() => {
            setAmount('');
            setCategory('');
            setIsExpanded(false);
          }}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={pending || !amount || !accountId}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
            amount && accountId
              ? type === 'expense'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-muted text-muted-foreground',
            pending && 'opacity-50 cursor-wait',
          )}
        >
          {pending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Log
            </>
          )}
        </button>
      </div>
    </div>
  );
}
