import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  is_completed: boolean;
}

export const ActiveMission = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentMission();
  }, []);

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

  const loadCurrentMission = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const period = calculateCurrentPeriod();

      const { data: mission } = await supabase
        .from('missions')
        .select('id')
        .eq('user_id', user.id)
        .eq('start_date', period.start)
        .maybeSingle();

      if (mission) {
        setMissionId(mission.id);
        
        const { data: taskData } = await supabase
          .from('mission_tasks')
          .select('id, description, is_completed')
          .eq('mission_id', mission.id)
          .order('created_at', { ascending: true })
          .limit(5);

        setTasks(taskData || []);
      }
    } catch (error: any) {
      console.error('Failed to load mission:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
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

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      ));
    } catch (error: any) {
      toast.error('Failed to update task');
    }
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
        <CardTitle className="uppercase text-primary">Active Mission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No active mission tasks</p>
            <Button variant="outline" onClick={() => navigate('/missions')}>
              Create Mission
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50">
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => toggleTask(task.id, task.is_completed)}
                  />
                  <span className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.description}
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/missions')}
            >
              View All Missions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
