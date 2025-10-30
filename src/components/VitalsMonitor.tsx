import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface HealthLog {
  log_date: string;
  value: number;
}

export const VitalsMonitor = () => {
  const [pushupData, setPushupData] = useState<HealthLog[]>([]);
  const [runningData, setRunningData] = useState<HealthLog[]>([]);
  const [workData, setWorkData] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load pushup data
      const { data: pushups } = await supabase
        .from('health_logs')
        .select('log_date, value')
        .eq('user_id', user.id)
        .eq('log_type', 'pushups')
        .order('log_date', { ascending: true })
        .limit(14);

      setPushupData(pushups || []);

      // Load running data
      const { data: running } = await supabase
        .from('health_logs')
        .select('log_date, value')
        .eq('user_id', user.id)
        .eq('log_type', 'running_km')
        .order('log_date', { ascending: true })
        .limit(14);

      setRunningData(running || []);

      // Load work hours data
      const { data: work } = await supabase
        .from('health_logs')
        .select('log_date, value')
        .eq('user_id', user.id)
        .eq('log_type', 'work_hours')
        .order('log_date', { ascending: true })
        .limit(14);

      setWorkData(work || []);
    } catch (error: any) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWorkHours = (value: number) => {
    return (value / 100).toFixed(1);
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
          <Activity className="h-5 w-5" />
          Vitals Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pushups" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pushups">Push-ups</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="work">Work</TabsTrigger>
          </TabsList>

          <TabsContent value="pushups" className="pt-4">
            {pushupData.length > 0 ? (
              <div className="h-48">
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
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </TabsContent>

          <TabsContent value="running" className="pt-4">
            {runningData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={runningData}>
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
                      formatter={(value: number) => [`${value} km`, 'Distance']}
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
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </TabsContent>

          <TabsContent value="work" className="pt-4">
            {workData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={workData}>
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
                      tickFormatter={(value) => formatWorkHours(value)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                      }}
                      formatter={(value: number) => [`${formatWorkHours(value)} hrs`, 'Hours']}
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
            ) : (
              <p className="text-center text-muted-foreground py-8">No data yet</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
