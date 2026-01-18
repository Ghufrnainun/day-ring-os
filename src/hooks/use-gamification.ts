'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './use-user';

export interface GamificationStats {
  id: string;
  user_id: string;
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_streak_date: string | null;
  updated_at: string;
}

export function useGamification() {
  const { data: user } = useUser();
  const supabase = createClient();

  return useQuery<GamificationStats | null>({
    queryKey: ['gamification_stats'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('gamification_stats')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error) {
        // PGRST116 = no rows found - this is expected for new users
        if (error.code !== 'PGRST116') {
          console.error('Failed to fetch gamification stats:', error);
        }
        // Return default values if no record exists
        return {
          id: '',
          user_id: user.id,
          points: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          last_streak_date: null,
          updated_at: new Date().toISOString(),
        };
      }

      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
