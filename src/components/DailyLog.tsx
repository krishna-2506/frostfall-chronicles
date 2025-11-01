import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, Clock, TrendingUp, Briefcase } from 'lucide-react';

export const DailyLog = () => {
  const [wakeupTime, setWakeupTime] = useState('');
  const [pushups, setPushups] = useState('');
  const [runningKm, setRunningKm] = useState('');
  const [dumbbellReps, setDumbbellReps] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data: logs } = await supabase
        .from('health_logs')
        .select('log_type, value')
        .eq('user_id', user.id)
        .eq('log_date', today);

      logs?.forEach(log => {
        if (log.log_type === 'wakeup') {
          const hours = Math.floor(log.value / 60);
          const minutes = log.value % 60;
          setWakeupTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        } else if (log.log_type === 'pushups') {
          setPushups(log.value.toString());
        } else if (log.log_type === 'running_km') {
          setRunningKm(log.value.toString());
        } else if (log.log_type === 'dumbbell_reps') {
          setDumbbellReps(log.value.toString());
        } else if (log.log_type === 'work_hours') {
          setWorkHours((log.value / 100).toString());
        }
      });
    } catch (error: any) {
      console.error('Failed to load today data:', error);
    }
  };

  const logAllVitals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      let totalXp = 0;

      // Log wakeup time
      if (wakeupTime) {
        const [hours, minutes] = wakeupTime.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;
        
        await supabase.from('health_logs').upsert({
          user_id: user.id,
          log_type: 'wakeup',
          value: timeInMinutes,
          log_date: today,
        });

        if (timeInMinutes <= 450) { // 7:30 AM or earlier
          await supabase.rpc('award_xp', { amount_to_add: 10, action_source: 'log_wakeup_early' });
          await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'wakeup_early' });
          totalXp += 10;
        }
      }

      // Log pushups
      if (pushups && parseInt(pushups) > 0) {
        await supabase.from('health_logs').upsert({
          user_id: user.id,
          log_type: 'pushups',
          value: parseInt(pushups),
          log_date: today,
        });

        if (parseInt(pushups) >= 20) {
          await supabase.rpc('award_xp', { amount_to_add: 10, action_source: 'log_pushups' });
          await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'pushups' });
          totalXp += 10;
        }
      }

      // Log running
      if (runningKm && parseFloat(runningKm) > 0) {
        await supabase.from('health_logs').upsert({
          user_id: user.id,
          log_type: 'running_km',
          value: parseFloat(runningKm),
          log_date: today,
        });

        if (parseFloat(runningKm) >= 2) {
          await supabase.rpc('award_xp', { amount_to_add: 10, action_source: 'log_running' });
          await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'running' });
          totalXp += 10;
        }
      }

      // Log dumbbell reps
      if (dumbbellReps && parseInt(dumbbellReps) > 0) {
        await supabase.from('health_logs').upsert({
          user_id: user.id,
          log_type: 'dumbbell_reps',
          value: parseInt(dumbbellReps),
          log_date: today,
        });

        if (parseInt(dumbbellReps) >= 30) {
          await supabase.rpc('award_xp', { amount_to_add: 10, action_source: 'log_dumbbells' });
          await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'dumbbells' });
          totalXp += 10;
        }
      }

      // Log work hours
      if (workHours && parseFloat(workHours) > 0) {
        const storedValue = Math.round(parseFloat(workHours) * 100);
        await supabase.from('health_logs').upsert({
          user_id: user.id,
          log_type: 'work_hours',
          value: storedValue,
          log_date: today,
        });

        if (parseFloat(workHours) >= 6) {
          await supabase.rpc('award_xp', { amount_to_add: 15, action_source: 'log_work_hours' });
          await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'work_hours' });
          totalXp += 15;
        }
      }

      if (totalXp > 0) {
        toast.success(`Vitals logged! +${totalXp} XP earned 🎯`);
      } else {
        toast.success('Vitals logged!');
      }
      
      // Refresh the page to update all components
      window.location.reload();
    } catch (error: any) {
      console.error('Failed to log vitals:', error);
      toast.error('Failed to log vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="uppercase text-primary">The Daily Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wakeup" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Wake-up Time
          </Label>
          <Input
            id="wakeup"
            type="time"
            value={wakeupTime}
            onChange={(e) => setWakeupTime(e.target.value)}
            className="bg-input/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pushups" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Push-ups
          </Label>
          <Input
            id="pushups"
            type="number"
            min="0"
            value={pushups}
            onChange={(e) => setPushups(e.target.value)}
            placeholder="0"
            className="bg-input/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="running" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Running (km)
          </Label>
          <Input
            id="running"
            type="number"
            step="0.1"
            min="0"
            value={runningKm}
            onChange={(e) => setRunningKm(e.target.value)}
            placeholder="0.0"
            className="bg-input/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dumbbells" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Dumbbell Reps
          </Label>
          <Input
            id="dumbbells"
            type="number"
            min="0"
            value={dumbbellReps}
            onChange={(e) => setDumbbellReps(e.target.value)}
            placeholder="0"
            className="bg-input/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="work-hours" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work Hours
          </Label>
          <Input
            id="work-hours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
            placeholder="7.5"
            className="bg-input/50"
          />
        </div>

        <Button
          onClick={logAllVitals}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          Log Vitals
        </Button>
      </CardContent>
    </Card>
  );
};
