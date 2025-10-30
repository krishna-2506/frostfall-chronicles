import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Zap } from 'lucide-react';

interface Streak {
  type: string;
  count: number;
  icon: string;
  label: string;
}

export const DailyStreakTracker = () => {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreaks();
  }, []);

  const loadStreaks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const allStreaks: Streak[] = [];

      // Load activity streaks (new gamification system)
      const { data: activityStreaks } = await supabase
        .from('activity_streaks')
        .select('streak_type, current_streak')
        .eq('user_id', user.id);

      activityStreaks?.forEach(streak => {
        let label = streak.streak_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let icon = '🔥';
        
        allStreaks.push({
          type: streak.streak_type,
          count: streak.current_streak,
          icon,
          label
        });
      });

      // Load old streaks (NoFap, Junk Food)
      const { data: oldStreaks } = await supabase
        .from('streaks')
        .select('streak_type, current_streak')
        .eq('user_id', user.id);

      oldStreaks?.forEach(streak => {
        let label = '';
        let icon = '🔥';
        
        if (streak.streak_type === 'nofap') {
          label = 'Mental Clarity (NoFap)';
          icon = '⚡';
        } else if (streak.streak_type === 'junk_food') {
          label = 'No Junk Food';
          icon = '🥗';
        }
        
        allStreaks.push({
          type: streak.streak_type,
          count: streak.current_streak,
          icon,
          label
        });
      });

      setStreaks(allStreaks);
    } catch (error: any) {
      console.error('Failed to load streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase text-primary flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Active Streaks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {streaks.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No active streaks. Start logging your daily activities!
          </p>
        ) : (
          <div className="space-y-3">
            {streaks.map((streak) => (
              <div
                key={streak.type}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{streak.icon}</span>
                  <span className="font-medium">{streak.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{streak.count}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
