import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useGamification } from '@/contexts/GamificationContext';
import {
  Shield,
  Target,
  Activity,
  TrendingUp,
  Clock,
  Zap,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DashboardStats {
  perfectDays: number;
  activeMissionTasks: number;
  completedToday: number;
  healthStatus: {
    wakeup: boolean;
    workout: boolean;
    sleep: boolean;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { level, totalXp, xpToNextLevel, progressPercentage } = useGamification();
  const [stats, setStats] = useState<DashboardStats>({
    perfectDays: 0,
    activeMissionTasks: 0,
    completedToday: 0,
    healthStatus: { wakeup: false, workout: false, sleep: false },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Load perfect days count
      const { data: healthLogs } = await supabase
        .from('health_logs')
        .select('log_date, log_type, value')
        .eq('user_id', user.id);

      const logsByDate = new Map<string, Map<string, number>>();
      healthLogs?.forEach(log => {
        if (!logsByDate.has(log.log_date)) {
          logsByDate.set(log.log_date, new Map());
        }
        logsByDate.get(log.log_date)!.set(log.log_type, log.value);
      });

      let perfectDaysCount = 0;
      logsByDate.forEach((logs) => {
        const wakeup = logs.get('wakeup');
        const pushups = logs.get('pushups');
        const workHours = logs.get('work_hours');
        if (
          wakeup !== undefined && wakeup <= 450 &&
          pushups !== undefined && pushups >= 5 &&
          workHours !== undefined && workHours >= 600
        ) {
          perfectDaysCount++;
        }
      });

      // Check today's vitals
      const todayLogs = logsByDate.get(today);
      const healthStatus = {
        wakeup: todayLogs?.has('wakeup') || false,
        workout: todayLogs?.has('pushups') || todayLogs?.has('running_km') || false,
        sleep: todayLogs?.has('sleep_hours') || false,
      };

      // Load active mission tasks
      const { data: tasks } = await supabase
        .from('mission_tasks')
        .select('id, is_completed')
        .eq('user_id', user.id);

      const activeTasks = tasks?.filter(t => !t.is_completed).length || 0;
      const completedToday = tasks?.filter(t => t.is_completed).length || 0;

      setStats({
        perfectDays: perfectDaysCount,
        activeMissionTasks: activeTasks,
        completedToday,
        healthStatus,
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-sm font-mono text-muted-foreground">INITIALIZING MISSION CONTROL...</p>
        </div>
      </div>
    );
  }

  const isPerfectDay = stats.healthStatus.wakeup && stats.healthStatus.workout;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-background via-background to-primary/5">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--primary-rgb,239,68,68)/0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary-rgb,239,68,68)/0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      <div className="relative container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono text-primary tracking-tight">
              MISSION CONTROL
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              Tactical Operations Dashboard // Clearance Level {level}
            </p>
          </div>
          {isPerfectDay && (
            <Badge className="bg-accent text-accent-foreground font-mono">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              PERFECT DAY STATUS
            </Badge>
          )}
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Operator Level */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                OPERATOR LEVEL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary mb-2">{level}</div>
              <Progress value={progressPercentage} className="h-2 mb-2" />
              <p className="text-xs text-muted-foreground font-mono">
                {totalXp} / {totalXp + xpToNextLevel} XP
              </p>
            </CardContent>
          </Card>

          {/* Perfect Days */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                PERFECT DAYS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-accent mb-2">{stats.perfectDays}</div>
              <p className="text-xs text-muted-foreground font-mono">
                Flawless operations completed
              </p>
            </CardContent>
          </Card>

          {/* Active Missions */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-tech" />
                ACTIVE TARGETS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-tech mb-2">{stats.activeMissionTasks}</div>
              <p className="text-xs text-muted-foreground font-mono">
                Objectives awaiting completion
              </p>
            </CardContent>
          </Card>

          {/* Completed Today */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                TODAY'S PROGRESS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-success mb-2">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground font-mono">
                Missions accomplished
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vitals Status & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Vitals Monitor */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-mono text-foreground flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                VITALS STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">Morning Protocol</span>
                </div>
                {stats.healthStatus.wakeup ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">Physical Training</span>
                </div>
                {stats.healthStatus.workout ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <Button
                onClick={() => navigate('/health')}
                variant="outline"
                className="w-full font-mono border-primary/20 hover:bg-primary/10"
              >
                ACCESS HEALTH CENTER
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-primary/20 shadow-[var(--shadow-tactical)] bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base font-mono text-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                QUICK OPERATIONS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/health')}
                className="w-full justify-start font-mono bg-primary hover:bg-primary/90"
              >
                <Activity className="h-4 w-4 mr-2" />
                LOG DAILY PROTOCOL
              </Button>
              <Button
                onClick={() => navigate('/focus')}
                variant="outline"
                className="w-full justify-start font-mono border-tech/50 text-tech hover:bg-tech/10"
              >
                <Target className="h-4 w-4 mr-2" />
                INITIATE FOCUS MODE
              </Button>
              <Button
                onClick={() => navigate('/tasks')}
                variant="outline"
                className="w-full justify-start font-mono border-accent/50 text-accent hover:bg-accent/10"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                VIEW MISSION OBJECTIVES
              </Button>
              <Button
                onClick={() => navigate('/missions')}
                variant="outline"
                className="w-full justify-start font-mono border-border/50 hover:bg-muted/50"
              >
                <Shield className="h-4 w-4 mr-2" />
                ACCESS MISSION LOG
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Classification Notice */}
        <div className="text-center py-4">
          <p className="text-[10px] font-mono text-muted-foreground/50 tracking-widest">
            CLASSIFIED // FOR AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
