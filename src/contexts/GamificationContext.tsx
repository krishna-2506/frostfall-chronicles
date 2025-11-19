import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface GamificationContextType {
  user: User | null;
  totalXp: number;
  level: number;
  xpToNextLevel: number;
  progressPercentage: number;
  loading: boolean;
  awardXp: (amount: number, source: string) => Promise<void>;
  refreshXp: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculate level from XP
  const calculateLevel = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
  
  const level = calculateLevel(totalXp);
  const currentLevelXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpToNextLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = (xpIntoLevel / xpToNextLevel) * 100;

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      if (authUser) {
        await loadXp(authUser.id);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadXp = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setTotalXp(data?.total_xp || 0);
    } catch (error) {
      console.error('Failed to load XP:', error);
    }
  };

  const refreshXp = async () => {
    if (user) {
      await loadXp(user.id);
    }
  };

  const awardXp = async (amount: number, source: string) => {
    try {
      await supabase.rpc('award_xp', { 
        amount_to_add: amount, 
        action_source: source 
      });
      await refreshXp();
    } catch (error) {
      console.error('Failed to award XP:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for XP changes in real-time
    const channel = supabase
      .channel('xp-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          refreshXp();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <GamificationContext.Provider
      value={{
        user,
        totalXp,
        level,
        xpToNextLevel,
        progressPercentage,
        loading,
        awardXp,
        refreshXp,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
