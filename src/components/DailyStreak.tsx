import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame } from "lucide-react";

export function DailyStreak() {
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Check if user completed any task today
    const { data: todayProgress } = await supabase
      .from('course_progress')
      .select('id')
      .eq('user_id', user.id)
      .gte('completed_at', `${today}T00:00:00`)
      .limit(1);

    const hasCompletedToday = todayProgress && todayProgress.length > 0;
    setCompletedToday(hasCompletedToday);

    // Get streak from activity_streaks table
    const { data: streakData } = await supabase
      .from('activity_streaks')
      .select('current_streak, last_checkin_date')
      .eq('user_id', user.id)
      .eq('streak_type', 'daily_task')
      .maybeSingle();

    if (streakData) {
      const lastDate = new Date(streakData.last_checkin_date);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        // Streak broken - reset
        setStreak(hasCompletedToday ? 1 : 0);
        if (hasCompletedToday) {
          await supabase
            .from('activity_streaks')
            .update({ current_streak: 1, last_checkin_date: today })
            .eq('user_id', user.id)
            .eq('streak_type', 'daily_task');
        }
      } else if (diffDays === 1 && hasCompletedToday) {
        // Continue streak
        const newStreak = streakData.current_streak + 1;
        setStreak(newStreak);
        await supabase
          .from('activity_streaks')
          .update({ current_streak: newStreak, last_checkin_date: today })
          .eq('user_id', user.id)
          .eq('streak_type', 'daily_task');
      } else if (diffDays === 0) {
        // Same day - keep current streak
        setStreak(streakData.current_streak);
      } else {
        setStreak(hasCompletedToday ? 1 : 0);
      }
    } else if (hasCompletedToday) {
      // No streak record yet - create one
      setStreak(1);
      await supabase
        .from('activity_streaks')
        .insert({ user_id: user.id, streak_type: 'daily_task', current_streak: 1, last_checkin_date: today });
    }

    setLoading(false);
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-border/50">
      <Flame className={`h-5 w-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{streak}</span>
        <span className="text-[10px] text-muted-foreground">day streak</span>
      </div>
      {completedToday && (
        <span className="ml-1 text-[10px] text-green-500">✓</span>
      )}
    </div>
  );
}
