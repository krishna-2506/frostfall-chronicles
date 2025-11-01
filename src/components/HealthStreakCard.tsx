import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Activity, TrendingUp, Dumbbell, Zap } from 'lucide-react';

interface StreakData {
  type: string;
  count: number;
  icon: JSX.Element;
  label: string;
  color: string;
}

export const HealthStreakCard = () => {
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreaks();
  }, []);

  const loadStreaks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activityStreaks } = await supabase
        .from('activity_streaks')
        .select('streak_type, current_streak')
        .eq('user_id', user.id)
        .in('streak_type', ['pushups', 'running', 'dumbbells']);

      const streakMap: { [key: string]: StreakData } = {
        pushups: {
          type: 'pushups',
          count: 0,
          icon: <Activity className="h-5 w-5" />,
          label: 'Push-ups Streak',
          color: 'text-blue-500',
        },
        running: {
          type: 'running',
          count: 0,
          icon: <TrendingUp className="h-5 w-5" />,
          label: 'Running Streak',
          color: 'text-green-500',
        },
        dumbbells: {
          type: 'dumbbells',
          count: 0,
          icon: <Dumbbell className="h-5 w-5" />,
          label: 'Dumbbell Streak',
          color: 'text-orange-500',
        },
      };

      activityStreaks?.forEach(streak => {
        if (streakMap[streak.streak_type]) {
          streakMap[streak.streak_type].count = streak.current_streak;
        }
      });

      setStreaks(Object.values(streakMap));
    } catch (error: any) {
      console.error('Failed to load health streaks:', error);
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
          <Zap className="h-5 w-5" />
          Performance Streaks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {streaks.map((streak) => (
            <div
              key={streak.type}
              className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
            >
              <div className="flex items-center gap-3">
                <div className={streak.color}>{streak.icon}</div>
                <span className="font-medium">{streak.label}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{streak.count}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
