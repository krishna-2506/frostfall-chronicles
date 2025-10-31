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

type XpLogEntry = {
  id: number;
  amount: number;
  source_action: string;
  created_at: string;
};

export default function XpLog() {
  const [logs, setLogs] = useState<XpLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('xp_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (error: any) {
      console.error('Failed to load XP logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalXp = logs.reduce((sum, log) => sum + log.amount, 0);

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
      <div className="container mx-auto">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight">
                AGENT XP LEDGER
              </CardTitle>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total XP Earned</div>
                <div className="text-2xl font-bold text-primary">+{totalXp}</div>
              </div>
            </div>
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
