import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Briefcase } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HealthLog {
  log_date: string;
  value: number;
}

export const WorkHoursTracker = () => {
  const [workHours, setWorkHours] = useState('');
  const [workHoursAvg, setWorkHoursAvg] = useState<number | null>(null);
  const [workHoursData, setWorkHoursData] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWorkHoursData();
  }, []);

  const loadWorkHoursData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load work hours for 7-day average
      const { data: avgLogs } = await supabase
        .from('health_logs')
        .select('value')
        .eq('user_id', user.id)
        .eq('log_type', 'work_hours')
        .order('log_date', { ascending: false })
        .limit(7);

      if (avgLogs && avgLogs.length > 0) {
        const avg = avgLogs.reduce((sum, log) => sum + log.value, 0) / avgLogs.length;
        setWorkHoursAvg(avg / 100); // Convert back from stored format
      }

      // Load work hours data for chart (last 14 days)
      const { data: chartLogs } = await supabase
        .from('health_logs')
        .select('log_date, value')
        .eq('user_id', user.id)
        .eq('log_type', 'work_hours')
        .order('log_date', { ascending: true })
        .limit(14);

      if (chartLogs) {
        setWorkHoursData(chartLogs);
      }
    } catch (error: any) {
      toast.error('Failed to load work hours data');
    }
  };

  const logWorkHours = async () => {
    const hours = parseFloat(workHours);
    if (!workHours || isNaN(hours) || hours < 0 || hours > 24) {
      toast.error('Please enter valid hours (0-24)');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store as hours * 100 to preserve decimals in integer column
      const storedValue = Math.round(hours * 100);

      const { error } = await supabase
        .from('health_logs')
        .upsert({
          user_id: user.id,
          log_type: 'work_hours',
          value: storedValue,
          log_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast.success('Work hours logged!');
      setWorkHours('');
      loadWorkHoursData();
    } catch (error: any) {
      toast.error('Failed to log work hours');
    } finally {
      setLoading(false);
    }
  };

  // Convert stored value back to decimal hours for display
  const formatHours = (value: number) => {
    return (value / 100).toFixed(1);
  };

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
      <div className="mb-4 flex items-center gap-3">
        <Briefcase className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Work Hours</h3>
      </div>

      {workHoursAvg !== null && (
        <div className="mb-4 rounded-lg bg-secondary/50 p-4 text-center backdrop-blur-sm">
          <p className="text-sm text-muted-foreground">7-Day Average</p>
          <p className="text-3xl font-bold text-primary">{workHoursAvg.toFixed(1)} hrs</p>
        </div>
      )}

      {workHoursData.length > 0 && (
        <div className="mb-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={workHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="log_date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                tickFormatter={(date) => new Date(date).getDate().toString()}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatHours(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
                formatter={(value: number) => [`${formatHours(value)} hrs`, 'Hours']}
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
          <Label htmlFor="work-hours">Today's Work Hours</Label>
          <Input
            id="work-hours"
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={workHours}
            onChange={(e) => setWorkHours(e.target.value)}
            placeholder="7.5"
            className="bg-input/50 backdrop-blur-sm"
          />
        </div>
        <Button
          onClick={logWorkHours}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          Log Work Hours
        </Button>
      </div>
    </Card>
  );
};
