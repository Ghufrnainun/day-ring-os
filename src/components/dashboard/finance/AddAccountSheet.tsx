'use client';

import * as React from 'react';
import { Plus, Wallet, Building2, Smartphone, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { createAccount } from '@/actions/accounts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank', icon: Building2 },
  { value: 'ewallet', label: 'E-Wallet', icon: Smartphone },
  { value: 'investment', label: 'Invest', icon: TrendingUp },
] as const;

interface AddAccountSheetProps {
  children?: React.ReactNode;
}

export function AddAccountSheet({ children }: AddAccountSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<
    'bank' | 'cash' | 'ewallet' | 'investment'
  >('cash');
  const [balance, setBalance] = React.useState('');
  const [isPending, setIsPending] = React.useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter account name');
      return;
    }

    setIsPending(true);
    try {
      await createAccount({
        name: name.trim(),
        type,
        opening_balance: parseFloat(balance) || 0,
      });

      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account created!');
      setOpen(false);
      setName('');
      setType('cash');
      setBalance('');
    } catch (error) {
      toast.error('Failed to create account');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Plus size={14} />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[340px] p-0 gap-0 rounded-2xl border border-white/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-5 pt-5 pb-3 text-center">
          <DialogTitle className="font-display font-medium text-lg tracking-tight">
            New Account
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4 space-y-5">
          {/* Account Type Toggle */}
          <div className="flex p-1 bg-muted/30 rounded-lg border border-white/10">
            {ACCOUNT_TYPES.map((t) => {
              const Icon = t.icon;
              const isSelected = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
            >
              Account Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Main Wallet, BCA, GoPay"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/10 border-white/10 h-10 rounded-lg text-sm"
              autoFocus
            />
          </div>

          {/* Opening Balance */}
          <div className="space-y-1.5">
            <Label
              htmlFor="balance"
              className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
            >
              Opening Balance
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="bg-white/10 border-white/10 h-10 rounded-lg text-sm pl-7"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-5 pt-4 border-t border-white/10 bg-white/5">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="w-full h-11 rounded-full text-sm font-medium shadow-md transition-all hover:scale-[1.01] bg-primary hover:bg-primary/90"
          >
            {isPending ? 'Creating...' : 'Create Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
