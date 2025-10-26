import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';

export const StreakTracker = () => {
  const [streak, setStreak] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', 'no_junk_food')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Calculate days from start_date
        const start = new Date(data.start_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setStreak(diffDays);
        setStartDate(start);
      } else {
        // Initialize streak
        const { error: insertError } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            streak_type: 'no_junk_food',
            current_streak: 0,
            start_date: new Date().toISOString().split('T')[0],
          });

        if (insertError) throw insertError;
        setStreak(0);
        setStartDate(new Date());
      }
    } catch (error: any) {
      console.error('Failed to load streak:', error);
    }
  };

  const resetStreak = async () => {
    if (!reason.trim()) {
      toast.error('Please note what you ate');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('streaks')
        .update({
          current_streak: 0,
          start_date: new Date().toISOString().split('T')[0],
          last_reset_date: new Date().toISOString(),
          last_reset_reason: reason.trim(),
        })
        .eq('user_id', user.id)
        .eq('streak_type', 'no_junk_food');

      if (error) throw error;

      toast.success('Streak reset. Start again tomorrow!');
      setStreak(0);
      setReason('');
      setStartDate(new Date());
      await loadStreak(); // Reload to confirm save
    } catch (error: any) {
      toast.error('Failed to reset streak');
      console.error('Reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
      <div className="mb-6 flex items-center gap-3">
        <Flame className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">No Junk Food Streak</h2>
      </div>

      <div className="mb-6 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-8 text-center backdrop-blur-sm">
        <div className="text-6xl font-bold text-primary mb-2">{streak}</div>
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          {streak === 1 ? 'Day' : 'Days'} Clean
        </div>
        {startDate && (
          <div className="mt-4 text-xs text-muted-foreground">
            Started: {startDate.toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason">What did you eat?</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Pizza and soda..."
            className="min-h-20 resize-none bg-input/50 backdrop-blur-sm"
          />
        </div>

        <Button
          onClick={resetStreak}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          Reset Streak
        </Button>
      </div>
    </Card>
  );
};
