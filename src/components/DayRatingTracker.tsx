import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star } from 'lucide-react';

export function DayRatingTracker() {
  const [todayRating, setTodayRating] = useState<number | null>(null);
  const [currentWeekAvg, setCurrentWeekAvg] = useState<number | null>(null);
  const [previousWeekAvg, setPreviousWeekAvg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      
      // Get today's rating
      const { data: todayData } = await supabase
        .from('daily_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('rating_date', today)
        .maybeSingle();

      if (todayData) {
        setTodayRating(todayData.rating);
      }

      // Calculate current week average (last 7 days)
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - 6);
      
      const { data: currentWeekData } = await supabase
        .from('daily_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .gte('rating_date', currentWeekStart.toISOString().split('T')[0])
        .lte('rating_date', today);

      if (currentWeekData && currentWeekData.length > 0) {
        const avg = currentWeekData.reduce((sum, r) => sum + r.rating, 0) / currentWeekData.length;
        setCurrentWeekAvg(Math.round(avg * 10) / 10);
      }

      // Calculate previous week average (days 7-13 ago)
      const previousWeekStart = new Date();
      previousWeekStart.setDate(previousWeekStart.getDate() - 13);
      const previousWeekEnd = new Date();
      previousWeekEnd.setDate(previousWeekEnd.getDate() - 7);

      const { data: previousWeekData } = await supabase
        .from('daily_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .gte('rating_date', previousWeekStart.toISOString().split('T')[0])
        .lte('rating_date', previousWeekEnd.toISOString().split('T')[0]);

      if (previousWeekData && previousWeekData.length > 0) {
        const avg = previousWeekData.reduce((sum, r) => sum + r.rating, 0) / previousWeekData.length;
        setPreviousWeekAvg(Math.round(avg * 10) / 10);
      }
    } catch (error: any) {
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const saveRating = async (rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('daily_ratings')
        .upsert({
          user_id: user.id,
          rating_date: today,
          rating: rating
        }, {
          onConflict: 'user_id,rating_date'
        });

      if (error) throw error;

      toast.success(`Day rated: ${rating}/10`);
      setTodayRating(rating);
      await loadRatings();
    } catch (error: any) {
      toast.error('Failed to save rating');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Star className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Day Rating</h2>
        </div>
        <p>Loading...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Star className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Day Rating</h2>
      </div>
      
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">How would you rate today? (1-10)</p>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
              <Button
                key={rating}
                variant={todayRating === rating ? "default" : "outline"}
                onClick={() => saveRating(rating)}
                className="h-12"
              >
                {rating}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">This Week Avg</p>
            <p className="text-2xl font-bold text-primary">
              {currentWeekAvg !== null ? currentWeekAvg : '--'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Week Avg</p>
            <p className="text-2xl font-bold">
              {previousWeekAvg !== null ? previousWeekAvg : '--'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
