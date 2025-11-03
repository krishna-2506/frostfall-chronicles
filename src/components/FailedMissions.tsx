import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface FailedMission {
  id: string;
  start_date: string;
  end_date: string;
  tasks: Array<{
    id: string;
    description: string;
    is_completed: boolean;
  }>;
}

export const FailedMissions = () => {
  const [failedMissions, setFailedMissions] = useState<FailedMission[]>([]);

  useEffect(() => {
    loadFailedMissions();
  }, []);

  const loadFailedMissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get only the most recent failed mission
      const { data: missions, error } = await supabase
        .from('missions')
        .select('id, start_date, end_date')
        .eq('user_id', user.id)
        .eq('status', 'failed')
        .order('start_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!missions || missions.length === 0) {
        setFailedMissions([]);
        return;
      }

      // Load tasks for the failed mission - only show incomplete tasks
      const { data: tasks } = await supabase
        .from('mission_tasks')
        .select('id, description, is_completed')
        .eq('mission_id', missions[0].id)
        .order('created_at', { ascending: true });

      // Only show if there are incomplete tasks
      const incompleteTasks = (tasks || []).filter(task => !task.is_completed);
      
      if (incompleteTasks.length > 0) {
        setFailedMissions([{
          ...missions[0],
          tasks: tasks || []
        }]);
      } else {
        setFailedMissions([]);
      }
    } catch (error: any) {
      console.error('Error loading failed missions:', error);
    }
  };

  const toggleTask = async (missionId: string, taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mission_tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      // Penalty XP for completing failed mission task
      if (!currentStatus) {
        await supabase.rpc('award_xp', { amount_to_add: -10, action_source: 'failed_mission_task' });
        toast.success('Task completed! -10 XP (penalty) ⚠️');
      }

      // Update local state
      setFailedMissions(prev => prev.map(mission => {
        if (mission.id === missionId) {
          const updatedTasks = mission.tasks.map(task =>
            task.id === taskId ? { ...task, is_completed: !currentStatus } : task
          );

          // Check if all tasks are completed
          const allCompleted = updatedTasks.every(task => task.is_completed);
          if (allCompleted && updatedTasks.length > 0) {
            // Mark mission as completed
            supabase
              .from('missions')
              .update({ status: 'completed' })
              .eq('id', missionId)
              .then(() => {
                toast.success('Failed mission redeemed! 🎯');
                loadFailedMissions();
              });
          }

          return { ...mission, tasks: updatedTasks };
        }
        return mission;
      }));
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  if (failedMissions.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 uppercase text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Failed Missions
        </CardTitle>
        <CardDescription className="font-mono">
          Complete these to redeem yourself (-10 XP penalty per task)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {failedMissions.map((mission) => (
          <div key={mission.id} className="space-y-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <p className="text-xs text-muted-foreground font-mono">
              {new Date(mission.start_date).toLocaleDateString()} - {new Date(mission.end_date).toLocaleDateString()}
            </p>
            <div className="space-y-2">
              {mission.tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <Checkbox
                    checked={task.is_completed}
                    onCheckedChange={() => toggleTask(mission.id, task.id, task.is_completed)}
                  />
                  <span className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
