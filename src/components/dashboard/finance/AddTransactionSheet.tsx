'use client';

import * as React from 'react';
import {
  Tag,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { useAccounts } from '@/hooks/use-accounts';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createTransaction } from '@/actions/finance';

interface AddTransactionSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTransactionSheet({
  children,
  open,
  onOpenChange,
}: AddTransactionSheetProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [note, setNote] = React.useState('');
  const [transactionDate, setTransactionDate] = React.useState<
    Date | undefined
  >(new Date());

  const { data: user } = useUser();
  const { data: accounts } = useAccounts();
  const [isPending, startTransition] = React.useTransition();

  const handleLogTransaction = () => {
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!accountId) {
      toast.error('Please select an account');
      return;
    }

    const numericAmount = Math.abs(parseFloat(amount));
    const logicalDay = format(transactionDate ?? new Date(), 'yyyy-MM-dd');
    const idempotencyKey = crypto.randomUUID();

    startTransition(async () => {
      try {
        const res = await createTransaction({
          amount: numericAmount,
          type,
          accountId,
          category,
          description: note,
          date: logicalDay,
          idempotencyKey,
        });

        if (res.success) {
          toast.success('Transaction logged');
          if (res.isOverdrawn) {
            toast.warning('Note: Account balance is now negative', {
              duration: 5000,
            });
          }

          setIsOpen?.(false);
          setAmount('');
          setNote('');
          setTransactionDate(new Date());
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to log transaction');
      }
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        setIsOpen?.(v);
        onOpenChange?.(v);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[380px] p-0 gap-0 rounded-2xl border border-white/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="font-display font-medium text-lg tracking-tight">
            {type === 'expense' ? 'Log Expense' : 'Log Income'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-4">
          {/* Amount Input */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative w-full max-w-[180px]">
              <span
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 text-xl font-light',
                  type === 'expense' ? 'text-destructive' : 'text-emerald-500'
                )}
              >
                $
              </span>
              <Input
                type="number"
                placeholder="0.00"
                className={cn(
                  'text-center text-3xl font-bold font-mono border-b-2 border-0 rounded-none focus-visible:ring-0 bg-transparent h-12 w-full px-8 placeholder:text-muted-foreground/20 transition-colors',
                  type === 'expense'
                    ? 'text-destructive border-destructive/30'
                    : 'text-emerald-500 border-emerald-500/30'
                )}
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Type Toggle */}
            <div className="flex p-1 bg-muted/30 rounded-lg border border-white/10">
              <button
                onClick={() => setType('expense')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  type === 'expense'
                    ? 'bg-white shadow-sm text-destructive'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowDownCircle size={14} />
                Expense
              </button>
              <button
                onClick={() => setType('income')}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  type === 'income'
                    ? 'bg-white shadow-sm text-emerald-600'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowUpCircle size={14} />
                Income
              </button>
            </div>
          </div>

          {/* Details Form */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="transaction-date"
                className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1"
              >
                <CalendarIcon size={11} /> Day
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="transaction-date"
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-9 w-full justify-start rounded-lg border-white/10 bg-white/10 text-left font-normal text-sm',
                      !transactionDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {transactionDate
                      ? format(transactionDate, 'MMM d')
                      : 'Pick'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => setTransactionDate(date ?? new Date())}
                    disabled={{ after: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="category"
                className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1"
              >
                <Tag size={11} /> Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 bg-white/10 border-white/10 rounded-lg text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food & Dining</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="utilities">Bills</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label
                htmlFor="account"
                className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1"
              >
                <CreditCard size={11} />{' '}
                {type === 'expense' ? 'Pay From' : 'Deposit To'}
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-9 bg-white/10 border-white/10 rounded-lg text-sm">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label
                htmlFor="note"
                className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Note (Optional)
              </Label>
              <Input
                id="note"
                placeholder="What was this for?"
                className="bg-white/10 border-white/10 h-9 rounded-lg text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-5 pt-4 border-t border-white/10 bg-white/10">
          <Button
            onClick={handleLogTransaction}
            disabled={isPending}
            className={cn(
              'w-full h-11 rounded-full text-sm font-medium shadow-md transition-all hover:scale-[1.01]',
              type === 'expense'
                ? 'bg-destructive hover:bg-destructive/90 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {isPending
              ? 'Logging...'
              : `Log ${type === 'expense' ? 'Expense' : 'Income'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
