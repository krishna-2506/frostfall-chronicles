import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Calendar, Bell, ChevronRight, ChevronDown } from "lucide-react";

interface Task {
  id: string;
  description: string;
  priority: string;
  estimated_pomodoros: number;
  notes: string | null;
  is_completed: boolean;
  parent_task_id: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  due_date: string | null;
  reminder_time: string | null;
  mission_id: string;
  subtasks?: Task[];
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<string>("");
  const [newTask, setNewTask] = useState({
    description: "",
    priority: "medium",
    estimated_pomodoros: 1,
    notes: "",
    is_recurring: false,
    recurrence_pattern: "",
    due_date: "",
    reminder_time: "",
  });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadMissions();
  }, []);

  useEffect(() => {
    if (selectedMission) {
      loadTasks();
    }
  }, [selectedMission]);

  const loadMissions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Only load active missions and last 5 completed/failed missions
    const { data: activeMissions } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const { data: recentMissions } = await supabase
      .from('missions')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);

    const allMissions = [...(activeMissions || []), ...(recentMissions || [])];
    
    if (allMissions.length > 0) {
      setMissions(allMissions);
      if (!selectedMission) {
        setSelectedMission(allMissions[0].id);
      }
    }
  };

  const loadTasks = async () => {
    if (!selectedMission) return;

    const { data } = await supabase
      .from('mission_tasks')
      .select('*')
      .eq('mission_id', selectedMission)
      .is('parent_task_id', null)
      .order('created_at', { ascending: false });

    if (data) {
      const tasksWithSubtasks = await Promise.all(
        data.map(async (task) => {
          const { data: subtasks } = await supabase
            .from('mission_tasks')
            .select('*')
            .eq('parent_task_id', task.id);
          return { ...task, subtasks: subtasks || [] };
        })
      );
      setTasks(tasksWithSubtasks);
    }
  };

  const addTask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedMission || !newTask.description) return;

    const { error } = await supabase.from('mission_tasks').insert({
      user_id: user.id,
      mission_id: selectedMission,
      ...newTask,
      due_date: newTask.due_date || null,
      reminder_time: newTask.reminder_time || null,
    });

    if (error) {
      toast.error('Failed to add task');
    } else {
      toast.success('Task added');
      setNewTask({
        description: "",
        priority: "medium",
        estimated_pomodoros: 1,
        notes: "",
        is_recurring: false,
        recurrence_pattern: "",
        due_date: "",
        reminder_time: "",
      });
      setIsDialogOpen(false);
      loadTasks();
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('mission_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
    } else {
      if (!currentStatus) {
        await supabase.rpc('award_xp', {
          amount_to_add: 15,
          action_source: 'Completed Task'
        });
      }
      loadTasks();
    }
  };

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mission Impossible Header */}
        <div className="text-center space-y-2 border-b border-primary/20 pb-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="destructive" className="bg-primary text-primary-foreground font-mono text-xs">CLASSIFIED</Badge>
            <h1 className="text-3xl font-bold text-primary tracking-wider">MISSION OBJECTIVES</h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono">TARGET ASSIGNMENT SYSTEM</p>
        </div>
        <div className="flex items-center justify-between">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold tracking-wider shadow-[var(--glow-alert)] border border-primary/50">
                  <Plus className="mr-2 h-4 w-4" />
                  ADD TARGET
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-primary/30">
                <DialogHeader>
                  <DialogTitle className="text-primary font-bold tracking-wider">CREATE NEW TARGET</DialogTitle>
                </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Task Description</Label>
                  <Input
                    placeholder="What needs to be done?"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Estimated Pomodoros</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newTask.estimated_pomodoros}
                      onChange={(e) => setNewTask({ ...newTask, estimated_pomodoros: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Reminder</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.reminder_time}
                      onChange={(e) => setNewTask({ ...newTask, reminder_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional details..."
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={newTask.is_recurring}
                    onCheckedChange={(checked) => setNewTask({ ...newTask, is_recurring: checked as boolean })}
                  />
                  <Label>Recurring Task</Label>
                </div>

                {newTask.is_recurring && (
                  <div>
                    <Label>Recurrence Pattern</Label>
                    <Select value={newTask.recurrence_pattern} onValueChange={(value) => setNewTask({ ...newTask, recurrence_pattern: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Every Day</SelectItem>
                        <SelectItem value="weekdays">Every Weekday</SelectItem>
                        <SelectItem value="weekly">Every Week</SelectItem>
                        <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                        <SelectItem value="monthly">Every Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={addTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-4 bg-card border-primary/20 shadow-[var(--shadow-tactical)]">
          <Label className="text-primary font-mono tracking-wide">SELECT OPERATION</Label>
          <Select value={selectedMission} onValueChange={setSelectedMission}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a mission" />
            </SelectTrigger>
            <SelectContent>
              {missions.map((mission) => (
                <SelectItem key={mission.id} value={mission.id}>
                  {new Date(mission.start_date).toLocaleDateString()} - {new Date(mission.end_date).toLocaleDateString()} ({mission.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-6 bg-card border-primary/20 shadow-[var(--shadow-tactical)]">
          <h2 className="text-xl font-semibold mb-4 text-primary font-mono tracking-wide">ACTIVE TARGETS</h2>
          {tasks.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-primary/30 rounded-lg">
              <p className="text-muted-foreground font-mono">NO ACTIVE TARGETS</p>
              <p className="text-sm text-muted-foreground/60 mt-1">AWAITING MISSION ASSIGNMENT</p>
            </div>
          ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="p-4 space-y-3 border-primary/20 bg-card/50 hover:bg-card transition-colors">
                <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={() => toggleTask(task.id, task.is_completed)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-lg ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.description}
                    </span>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {task.is_recurring && (
                      <Badge variant="outline">Recurring</Badge>
                    )}
                    <Badge variant="secondary">
                      🍅 {task.estimated_pomodoros}
                    </Badge>
                  </div>

                  {(task.due_date || task.reminder_time) && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleString()}
                        </div>
                      )}
                      {task.reminder_time && (
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          Reminder set
                        </div>
                      )}
                    </div>
                  )}

                  {task.notes && (
                    <p className="text-sm text-muted-foreground">{task.notes}</p>
                  )}

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(task.id)}
                        className="h-8 px-2"
                      >
                        {expandedTasks.has(task.id) ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        {task.subtasks.length} subtasks
                      </Button>

                      {expandedTasks.has(task.id) && (
                        <div className="ml-6 mt-2 space-y-2 border-l-2 border-border pl-4">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={subtask.is_completed}
                                onCheckedChange={() => toggleTask(subtask.id, subtask.is_completed)}
                              />
                              <span className={subtask.is_completed ? 'line-through text-muted-foreground' : ''}>
                                {subtask.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            ))}
          </div>
          )}
        </Card>
      </div>
    </div>
  );
}