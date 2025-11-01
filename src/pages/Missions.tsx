import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

interface Mission {
  id: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
}

interface Task {
  id: string;
  description: string;
  is_completed: boolean;
}

const Missions = () => {
  const navigate = useNavigate();
  const [mission, setMission] = useState<Mission | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [loading, setLoading] = useState(true);

  // Calculate current 4-day period based on Winter Arc start date (May 26, 2026)
  const calculateCurrentPeriod = () => {
    const arcStartDate = new Date('2026-05-26');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const daysSinceStart = Math.floor((today.getTime() - arcStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const periodIndex = Math.floor(daysSinceStart / 4);
    
    const periodStart = new Date(arcStartDate);
    periodStart.setDate(periodStart.getDate() + (periodIndex * 4));
    
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 3);
    
    return {
      start: periodStart.toISOString().split('T')[0],
      end: periodEnd.toISOString().split('T')[0]
    };
  };

  const loadMission = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const period = calculateCurrentPeriod();

      // Try to fetch existing mission for current period
      const { data: existingMission, error: fetchError } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', user.id)
        .eq('start_date', period.start)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingMission) {
        setMission(existingMission);
        await loadTasks(existingMission.id);
      } else {
        // Create new mission for current period
        const { data: newMission, error: createError } = await supabase
          .from('missions')
          .insert({
            user_id: user.id,
            start_date: period.start,
            end_date: period.end
          })
          .select()
          .single();

        if (createError) throw createError;
        setMission(newMission);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading mission:', error);
      toast.error('Failed to load mission');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (missionId: string) => {
    try {
      const { data, error } = await supabase
        .from('mission_tasks')
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const addTask = async () => {
    if (!mission || !newTaskDescription.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mission_tasks')
        .insert({
          mission_id: mission.id,
          user_id: user.id,
          description: newTaskDescription.trim()
        })
        .select()
        .single();

      if (error) throw error;

      setTasks([...tasks, data]);
      setNewTaskDescription('');
      toast.success('Task added');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mission_tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      // Award XP if completing the task
      if (!currentStatus) {
        await supabase.rpc('award_xp', { amount_to_add: 25, action_source: 'mission_task_complete' });
        toast.success('Task completed! +25 XP 🎯');
      }

      const updatedTasks = tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      );
      setTasks(updatedTasks);

      // Check if all tasks are completed and mission is locked
      if (mission?.is_locked) {
        const allCompleted = updatedTasks.every(task => task.is_completed);
        if (allCompleted && updatedTasks.length > 0) {
          toast.success('🎉 All objectives complete! Mission accomplished!');
          // Reload to get next period's mission
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  const lockMission = async () => {
    if (!mission) return;

    try {
      const { error } = await supabase
        .from('missions')
        .update({ is_locked: true })
        .eq('id', mission.id);

      if (error) throw error;

      setMission({ ...mission, is_locked: true });
      toast.success('Mission locked');
    } catch (error) {
      console.error('Error locking mission:', error);
      toast.error('Failed to lock mission');
    }
  };

  const updateCountdown = () => {
    if (!mission) return;

    const endDate = new Date(mission.end_date);
    endDate.setHours(23, 59, 59, 999);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    // If mission period has ended, reload to get next period
    if (diff <= 0) {
      setTimeRemaining('00:00:00');
      // Auto-reload to next period
      setTimeout(() => {
        toast.info('Mission period ended. Loading next operation...');
        window.location.reload();
      }, 1000);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  };

  useEffect(() => {
    loadMission();
  }, []);

  useEffect(() => {
    if (mission) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [mission]);

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase">4-Day Operations</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">TACTICAL MISSION PLANNING</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Mission Control
          </Button>
        </div>

        {mission && (
          <>
            <Card>
              <CardHeader className="relative">
                <div className="absolute top-4 right-4 rotate-12 opacity-40">
                  <span className="text-[10px] font-bold text-primary tracking-widest border border-primary px-1.5 py-0.5">
                    CLASSIFIED
                  </span>
                </div>
                <CardTitle className="uppercase">Current Operation</CardTitle>
                <CardDescription className="font-mono">
                  {new Date(mission.start_date).toLocaleDateString()} - {new Date(mission.end_date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2 font-mono uppercase tracking-wider">Time Remaining</p>
                  <p className="text-5xl font-bold font-mono text-primary">{timeRemaining}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{completedTasks} / {tasks.length} tasks</span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter new task description..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    disabled={mission.is_locked}
                  />
                  <Button onClick={addTask} disabled={mission.is_locked || !newTaskDescription.trim()}>
                    Add Task
                  </Button>
                </div>

                <Button
                  onClick={lockMission}
                  disabled={mission.is_locked}
                  variant="destructive"
                  className="w-full uppercase tracking-wider"
                >
                  {mission.is_locked ? '🔒 Operation Locked' : '🔒 Lock Operation'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="uppercase">Mission Tasks</CardTitle>
                <CardDescription className="font-mono">
                  {tasks.length === 0 ? 'No tasks assigned. Add your first objective above!' : `${tasks.length} objective(s) for this operation`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, task.is_completed)}
                      />
                      <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                        {task.description}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Missions;
