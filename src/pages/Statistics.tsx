import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, Clock, Target, TrendingUp } from "lucide-react";

interface Stats {
  totalPomodoros: number;
  totalFocusTime: number;
  completedTasks: number;
  avgSessionsPerDay: number;
  dailyData: any[];
  weeklyData: any[];
  projectDistribution: any[];
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats>({
    totalPomodoros: 0,
    totalFocusTime: 0,
    completedTasks: 0,
    avgSessionsPerDay: 0,
    dailyData: [],
    weeklyData: [],
    projectDistribution: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Get pomodoro sessions
      const { data: sessions } = await supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .eq('completed', true);

      // Get completed tasks
      const { data: tasks } = await supabase
        .from('mission_tasks')
        .select('*, missions!inner(*)')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const totalPomodoros = sessions?.length || 0;
      const totalFocusTime = sessions?.reduce((acc, s) => acc + s.duration_minutes, 0) || 0;
      const completedTasks = tasks?.length || 0;

      // Calculate daily data for last 7 days
      const dailyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySessions = sessions?.filter(s => 
          s.started_at.startsWith(dateStr)
        ) || [];

        const dayTasks = tasks?.filter(t => {
          const completedAt = new Date(t.created_at);
          return completedAt.toISOString().split('T')[0] === dateStr;
        }) || [];

        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pomodoros: daySessions.length,
          tasks: dayTasks.length,
          minutes: daySessions.reduce((acc, s) => acc + s.duration_minutes, 0),
        });
      }

      // Calculate weekly data for last 4 weeks
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));

        const weekSessions = sessions?.filter(s => {
          const sessionDate = new Date(s.started_at);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        }) || [];

        weeklyData.push({
          week: `Week ${4 - i}`,
          pomodoros: weekSessions.length,
          hours: Math.round(weekSessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60 * 10) / 10,
        });
      }

      // Group tasks by week instead of individual missions
      const weekMap = new Map();
      tasks?.forEach(task => {
        const taskDate = new Date(task.missions.start_date);
        const weekStart = new Date(taskDate);
        weekStart.setDate(taskDate.getDate() - taskDate.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            name: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            tasks: 0,
          });
        }
        weekMap.get(weekKey).tasks++;
      });

      const projectDistribution = Array.from(weekMap.values()).slice(-6); // Last 6 weeks

      setStats({
        totalPomodoros,
        totalFocusTime,
        completedTasks,
        avgSessionsPerDay: Math.round((totalPomodoros / 7) * 10) / 10,
        dailyData,
        weeklyData,
        projectDistribution,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading statistics...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Statistics & Reports</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Focus Time</p>
                <p className="text-2xl font-bold">{Math.round(stats.totalFocusTime / 60)}h</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pomodoros</p>
                <p className="text-2xl font-bold">{stats.totalPomodoros}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Daily Sessions</p>
                <p className="text-2xl font-bold">{stats.avgSessionsPerDay}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Activity (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pomodoros" stroke="hsl(var(--primary))" name="Pomodoros" />
                  <Line type="monotone" dataKey="tasks" stroke="hsl(var(--secondary))" name="Tasks" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Focus Time Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pomodoros" fill="hsl(var(--primary))" name="Pomodoros" />
                  <Bar dataKey="hours" fill="hsl(var(--secondary))" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Task Distribution by Week</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stats.projectDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.tasks}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="tasks"
                  >
                    {stats.projectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}