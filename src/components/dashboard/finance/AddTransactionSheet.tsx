'use client';

import * as React from 'react';
import { Tag, CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { useAccounts } from '@/hooks/use-accounts';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const [isOpen, setIsOpen] = React.useState(open || false);
  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [accountId, setAccountId] = React.useState('');
  const [note, setNote] = React.useState('');

  const { data: user } = useUser();
  const { data: accounts } = useAccounts();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { mutate: createTransaction, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!amount || isNaN(parseFloat(amount)))
        throw new Error('Valid amount required');
      if (!accountId) throw new Error('Account required');

      const numericAmount = Math.abs(parseFloat(amount));
      const logicalDay = format(new Date(), 'yyyy-MM-dd'); // Today

      const payload: any = {
        user_id: user.id,
        amount: numericAmount,
        type: type,
        category: category || 'Uncategorized', // Default
        description: note,
        logical_day: logicalDay,
      };

      if (type === 'expense') {
        payload.from_account_id = accountId;
      } else {
        payload.to_account_id = accountId;
      }

      const { error } = await supabase.from('transactions').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Transaction logged');
      setIsOpen(false);
      setAmount('');
      setNote('');

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Balance updates
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to log transaction');
    },
  });

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(v) => {
        setIsOpen(v);
        onOpenChange?.(v);
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-[2rem] p-0 border-t border-white/20 bg-background/95 backdrop-blur-xl bg-grain"
      >
        <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
          <SheetHeader className="px-6 pt-8 pb-2 text-center">
            <SheetTitle className="font-display font-medium text-xl tracking-tight text-muted-foreground/80">
              {type === 'expense' ? 'Log Expense' : 'Log Income'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
            {/* Amount Input */}
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="relative">
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-light',
                    type === 'expense' ? 'text-destructive' : 'text-emerald-500'
                  )}
                >
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className={cn(
                    'text-center text-6xl font-bold font-mono border-0 focus-visible:ring-0 bg-transparent h-20 w-full pl-8 placeholder:text-muted-foreground/20',
                    type === 'expense' ? 'text-destructive' : 'text-emerald-500'
                  )}
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Type Toggle */}
              <div className="flex p-1 bg-muted/20 rounded-full border border-white/5">
                <button
                  onClick={() => setType('expense')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    type === 'expense'
                      ? 'bg-white shadow-sm text-destructive'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowDownCircle size={16} />
                  Expense
                </button>
                <button
                  onClick={() => setType('income')}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    type === 'income'
                      ? 'bg-white shadow-sm text-emerald-600'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowUpCircle size={16} />
                  Income
                </button>
              </div>
            </div>

            {/* Details Form using Grid */}
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2"
                >
                  <Tag size={14} /> Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="utilities">Bills & Utilities</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="account"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2"
                >
                  <CreditCard size={14} />{' '}
                  {type === 'expense' ? 'Pay From' : 'Deposit To'}
                </Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
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

              <div className="space-y-2">
                <Label
                  htmlFor="note"
                  className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                >
                  Note (Optional)
                </Label>
                <Input
                  id="note"
                  placeholder="What was this for?"
                  className="bg-white/5 border-white/10 h-12 rounded-xl"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="p-6 pb-12 sm:pb-6 border-t border-white/10 bg-white/5 backdrop-blur-md">
            <Button
              onClick={() => createTransaction()}
              disabled={isPending}
              className={cn(
                'w-full h-12 rounded-full text-lg font-medium shadow-lg transition-all hover:scale-[1.02]',
                type === 'expense'
                  ? 'bg-destructive hover:bg-destructive/90 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              {isPending
                ? 'Logging...'
                : `Log ${type === 'expense' ? 'Expense' : 'Income'}`}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
