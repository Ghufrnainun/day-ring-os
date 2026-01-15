import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './use-user';

export function useAccounts() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['accounts'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      // 1. Fetch accounts
      const { data, error } = await supabase
        .from('money_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      // 2. If empty, try to create default using our RPC (if we could calling it directly)
      // Since we can't easily call "ensure_default_wallet" from client without exposing it,
      // we will check length. If 0, we can invoke a secondary insert.
      // But better: Just handle empty state in UI or insert explicitly if needed.
      // Actually, we can use rpc if we expose it.

      if (data.length === 0) {
        const { data: walletId, error: rpcError } = await supabase.rpc(
          'ensure_default_wallet',
          { target_user_id: user.id }
        );
        if (!rpcError) {
          // Refetch
          const { data: newData } = await supabase
            .from('money_accounts')
            .select('*')
            .eq('user_id', user.id);
          return newData || [];
        }
      }

      return data;
    },
  });
}
