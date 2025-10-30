import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

export const PerfectDayCounter = () => {
  const [perfectDays, setPerfectDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerfectDays();
  }, []);

  const loadPerfectDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('health_logs')
        .select('log_date, log_type, value')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });

      if (error) throw error;

      // Group logs by date
      const logsByDate = new Map<string, Map<string, number>>();
      
      data?.forEach(log => {
        if (!logsByDate.has(log.log_date)) {
          logsByDate.set(log.log_date, new Map());
        }
        logsByDate.get(log.log_date)!.set(log.log_type, log.value);
      });

      // Count perfect days
      let count = 0;
      logsByDate.forEach((logs) => {
        const wakeup = logs.get('wakeup');
        const pushups = logs.get('pushups');
        const workHours = logs.get('work_hours');

        const isPerfectDay = 
          wakeup !== undefined && wakeup <= 450 && // 7:30 AM or earlier
          pushups !== undefined && pushups >= 5 &&
          workHours !== undefined && workHours >= 600; // 6.0 hours (stored as 600)

        if (isPerfectDay) count++;
      });

      setPerfectDays(count);
    } catch (error: any) {
      console.error('Failed to load perfect days:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
      <Calendar className="h-3.5 w-3.5" />
      <span className="font-semibold text-foreground">{perfectDays}</span>
      <span>Perfect Days</span>
    </div>
  );
};
