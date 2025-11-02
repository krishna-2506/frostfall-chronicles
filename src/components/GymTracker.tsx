import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';

interface GymLog {
  id: string;
  muscle_group: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
}

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio'
];

export const GymTracker = () => {
  const [todayLogs, setTodayLogs] = useState<GymLog[]>([]);
  const [muscleGroup, setMuscleGroup] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayLogs();
  }, []);

  const loadTodayLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('gym_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodayLogs(data || []);
    } catch (error: any) {
      console.error('Error loading gym logs:', error);
    }
  };

  const addExercise = async () => {
    if (!muscleGroup || !exerciseName || !sets || !reps) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('gym_logs')
        .insert({
          user_id: user.id,
          muscle_group: muscleGroup,
          exercise_name: exerciseName,
          sets: parseInt(sets),
          reps: parseInt(reps),
          weight: parseFloat(weight) || 0
        });

      if (error) throw error;

      // Award XP and check gym streak
      await supabase.rpc('award_xp', { amount_to_add: 15, action_source: 'gym_exercise_logged' });
      await supabase.rpc('handle_activity_checkin', { streak_type_to_check: 'gym' });
      
      toast.success('Exercise logged! +15 XP 💪');

      // Reset form
      setMuscleGroup('');
      setExerciseName('');
      setSets('');
      setReps('');
      setWeight('');

      loadTodayLogs();
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      toast.error('Failed to log exercise');
    } finally {
      setLoading(false);
    }
  };

  const deleteExercise = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gym_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Exercise deleted');
      loadTodayLogs();
    } catch (error: any) {
      console.error('Error deleting exercise:', error);
      toast.error('Failed to delete exercise');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 uppercase text-primary">
          <Dumbbell className="h-5 w-5" />
          Gym Arsenal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Muscle Group</Label>
            <Select value={muscleGroup} onValueChange={setMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select muscle group" />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label>Exercise Name</Label>
            <Input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g., Bench Press"
            />
          </div>

          <div>
            <Label>Sets</Label>
            <Input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="3"
            />
          </div>

          <div>
            <Label>Reps</Label>
            <Input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="12"
            />
          </div>

          <div className="col-span-2">
            <Label>Weight (kg) - Optional</Label>
            <Input
              type="number"
              step="0.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <Button onClick={addExercise} disabled={loading} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Log Exercise
        </Button>

        {todayLogs.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-semibold text-sm">Today's Session</h4>
            {todayLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{log.exercise_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.muscle_group} • {log.sets}x{log.reps} {log.weight > 0 && `@ ${log.weight}kg`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteExercise(log.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
