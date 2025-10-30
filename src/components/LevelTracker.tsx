import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const LevelTracker = () => {
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadXp();
  }, []);

  const loadXp = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setTotalXp(data?.total_xp || 0);
    } catch (error: any) {
      console.error('Failed to load XP:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate level using formula: level = floor(0.1 * sqrt(total_xp))
  const level = Math.floor(0.1 * Math.sqrt(totalXp));
  
  // Calculate XP needed for next level: next_level_xp = (level + 1 / 0.1)^2
  const nextLevelXp = Math.pow((level + 1) / 0.1, 2);
  const currentLevelXp = Math.pow(level / 0.1, 2);
  const xpIntoLevel = totalXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = (xpIntoLevel / xpNeededForLevel) * 100;

  if (loading) {
    return (
      <div className="h-12 w-12 rounded-full bg-secondary animate-pulse" />
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative h-12 w-12 cursor-pointer">
            {/* Circular progress */}
            <svg className="h-12 w-12 -rotate-90 transform">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercentage / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            {/* Level in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">{level}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p className="font-semibold">Level {level}</p>
            <p>{totalXp} / {Math.round(nextLevelXp)} XP</p>
            <Progress value={progressPercentage} className="h-1 w-24" />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
