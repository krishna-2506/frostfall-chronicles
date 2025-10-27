import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

export function NoFapStreakTracker() {
  const [streak, setStreak] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');

  useEffect(() => {
    loadStreak();
  }, []);

  const loadStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: streakData, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .eq('streak_type', 'nofap')
        .maybeSingle();

      if (error) throw error;

      if (streakData) {
        const start = new Date(streakData.start_date);
        const now = new Date();
        const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        setStreak(days);
        setStartDate(streakData.start_date);
      } else {
        // Initialize streak
        const today = new Date().toISOString().split('T')[0];
        const { error: insertError } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            streak_type: 'nofap',
            start_date: today,
            current_streak: 0
          });

        if (insertError) throw insertError;
        setStreak(0);
        setStartDate(today);
      }
    } catch (error: any) {
      toast.error('Failed to load streak');
    } finally {
      setLoading(false);
    }
  };

  const resetStreak = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error('Please provide a reason for resetting');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('streaks')
        .update({
          start_date: today,
          current_streak: 0,
          last_reset_date: new Date().toISOString(),
          last_reset_reason: trimmedReason
        })
        .eq('user_id', user.id)
        .eq('streak_type', 'nofap');

      if (error) throw error;

      toast.success('Streak reset successfully');
      setReason('');
      await loadStreak();
    } catch (error: any) {
      toast.error('Failed to reset streak');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">NoFap Streak</h2>
        </div>
        <p>Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">NoFap Streak</h2>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-4xl font-bold text-primary">{streak} days</p>
          <p className="text-sm text-muted-foreground mt-1">
            Started: {new Date(startDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason for reset (if needed):</label>
          <Textarea
            placeholder="What happened?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
          <Button 
            onClick={resetStreak}
            variant="destructive"
            className="w-full"
          >
            Reset Streak
          </Button>
        </div>
      </div>
    </Card>
  );
}
