import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthLog {
  log_date: string;
  value: number;
}

export const HealthTracker = () => {
  const [wakeupTime, setWakeupTime] = useState('');
  const [pushups, setPushups] = useState('');
  const [wakeupAvg, setWakeupAvg] = useState<number | null>(null);
  const [pushupData, setPushupData] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load wakeup times for average
      const { data: wakeupLogs } = await supabase
        .from('health_logs')
        .select('value')
        .eq('user_id', user.id)
        .eq('log_type', 'wakeup')
        .order('log_date', { ascending: false })
        .limit(7);

      if (wakeupLogs && wakeupLogs.length > 0) {
        const avg = wakeupLogs.reduce((sum, log) => sum + log.value, 0) / wakeupLogs.length;
        setWakeupAvg(Math.round(avg));
      }

      // Load pushup data for chart
      const { data: pushupLogs } = await supabase
        .from('health_logs')
        .select('log_date, value')
        .eq('user_id', user.id)
        .eq('log_type', 'pushups')
        .order('log_date', { ascending: true })
        .limit(14);

      if (pushupLogs) {
        setPushupData(pushupLogs);
      }
    } catch (error: any) {
      console.error('Failed to load health data:', error);
    }
  };

  const logWakeup = async () => {
    if (!wakeupTime) {
      toast.error('Please enter a wake-up time');
      return;
    }

    const [hours, minutes] = wakeupTime.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('health_logs')
        .upsert({
          user_id: user.id,
          log_type: 'wakeup',
          value: timeInMinutes,
          log_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast.success('Wake-up time logged!');
      setWakeupTime('');
      loadHealthData();
    } catch (error: any) {
      toast.error('Failed to log wake-up time');
    } finally {
      setLoading(false);
    }
  };

  const logPushups = async () => {
    if (!pushups || parseInt(pushups) < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('health_logs')
        .upsert({
          user_id: user.id,
          log_type: 'pushups',
          value: parseInt(pushups),
          log_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast.success('Push-ups logged!');
      setPushups('');
      loadHealthData();
    } catch (error: any) {
      toast.error('Failed to log push-ups');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Wake-up Tracker */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
        <div className="mb-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Wake-up Time</h3>
        </div>

        {wakeupAvg !== null && (
          <div className="mb-4 rounded-lg bg-secondary/50 p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">7-Day Average</p>
            <p className="text-3xl font-bold text-primary">{formatTime(wakeupAvg)}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="wakeup">Today's Wake-up Time</Label>
            <Input
              id="wakeup"
              type="time"
              value={wakeupTime}
              onChange={(e) => setWakeupTime(e.target.value)}
              className="bg-input/50 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={logWakeup}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Log Wake-up
          </Button>
        </div>
      </Card>

      {/* Push-ups Tracker */}
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
        <div className="mb-4 flex items-center gap-3">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Push-ups</h3>
        </div>

        {pushupData.length > 0 && (
          <div className="mb-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pushupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="log_date" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(date) => new Date(date).getDate().toString()}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pushups">Today's Push-ups</Label>
            <Input
              id="pushups"
              type="number"
              min="0"
              value={pushups}
              onChange={(e) => setPushups(e.target.value)}
              placeholder="0"
              className="bg-input/50 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={logPushups}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            Log Push-ups
          </Button>
        </div>
      </Card>
    </div>
  );
};
