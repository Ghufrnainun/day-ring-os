import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useUser } from './use-user';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  timezone: string;
  active_modules: Record<string, boolean>;
  is_public: boolean;
  setup_completed: boolean;
}

export function useProfile() {
  const supabase = createClient();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });
}
