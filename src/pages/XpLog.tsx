import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Trophy, Flame, Target, Zap } from 'lucide-react';

type XpLogEntry = {
  id: number;
  amount: number;
  source_action: string;
  created_at: string;
};

export default function XpLog() {
  const [logs, setLogs] = useState<XpLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [streaks, setStreaks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load XP logs
      const { data: logsData, error: logsError } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);

      // Load total XP from user_stats
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('total_xp')
        .eq('user_id', user.id)
        .maybeSingle();

      setTotalXp(statsData?.total_xp || 0);

      // Load perfect days count from streaks table
      const { data: perfectDaysData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .eq('streak_type', 'perfect_day')
        .maybeSingle();

      setPerfectDays(perfectDaysData?.current_streak || 0);

      // Load all streaks
      const { data: allStreaksData } = await supabase
        .from('streaks')
        .select('streak_type, current_streak')
        .eq('user_id', user.id)
        .order('current_streak', { ascending: false });

      const { data: activityStreaksData } = await supabase
        .from('activity_streaks')
        .select('streak_type, current_streak')
        .eq('user_id', user.id)
        .order('current_streak', { ascending: false });

      setStreaks([...(allStreaksData || []), ...(activityStreaksData || [])]);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const level = Math.floor(0.1 * Math.sqrt(totalXp));

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse">Loading XP Ledger...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">+{totalXp}</div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-tech/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-tech/10 p-3">
                  <Target className="h-6 w-6 text-tech" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-tech">{level}</div>
                  <div className="text-sm text-muted-foreground">Agent Level</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gold/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-gold/10 p-3">
                  <Trophy className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold">{perfectDays}</div>
                  <div className="text-sm text-muted-foreground">Perfect Days</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-alert/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-alert/10 p-3">
                  <Flame className="h-6 w-6 text-alert" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-alert">{streaks.length}</div>
                  <div className="text-sm text-muted-foreground">Active Streaks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* XP History Table */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              AGENT XP LEDGER
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No XP earned yet. Complete activities to start earning!
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Source of XP</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>{log.source_action}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          +{log.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
