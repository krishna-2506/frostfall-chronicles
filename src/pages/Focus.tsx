import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Pause, SkipForward, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface Task {
  id: string;
  description: string;
  mission_id: string;
}

interface PomodoroSettings {
  work_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  sessions_before_long_break: number;
  auto_start_breaks: boolean;
  auto_start_pomodoros: boolean;
}

type SessionType = 'work' | 'short_break' | 'long_break';

export default function Focus() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [settings, setSettings] = useState<PomodoroSettings>({
    work_duration: 25,
    short_break_duration: 5,
    long_break_duration: 15,
    sessions_before_long_break: 4,
    auto_start_breaks: false,
    auto_start_pomodoros: false,
  });
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadSettings();
    loadTasks();
    
    // Create audio element for notification
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2W66+ifUhELTqXh8LdlHQQ0j9nyy3ooBS55y/LahTcJF2W67+mjUhELTKPf8Ldk');
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('pomodoro_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    if (data) {
      setSettings(data);
      setTimeLeft(data.work_duration * 60);
    } else {
      // Create default settings
      await supabase.from('pomodoro_settings').insert({
        user_id: user.id,
        ...settings
      });
    }
  };

  const loadTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: missions } = await supabase
      .from('missions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (missions) {
      const { data: tasksData } = await supabase
        .from('mission_tasks')
        .select('*')
        .eq('mission_id', missions.id)
        .eq('is_completed', false);

      if (tasksData) setTasks(tasksData);
    }
  };

  const handleSessionComplete = async () => {
    setIsRunning(false);
    audioRef.current?.play();
    
    if (currentSessionId) {
      await supabase
        .from('pomodoro_sessions')
        .update({ completed: true, ended_at: new Date().toISOString() })
        .eq('id', currentSessionId);
    }

    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Award XP for completed pomodoro
      await supabase.rpc('award_xp', { 
        amount_to_add: 10, 
        action_source: 'Completed Pomodoro Session' 
      });

      const nextSessionType: SessionType = 
        newCompletedSessions % settings.sessions_before_long_break === 0
          ? 'long_break'
          : 'short_break';
      
      setSessionType(nextSessionType);
      const duration = nextSessionType === 'long_break' 
        ? settings.long_break_duration 
        : settings.short_break_duration;
      setTimeLeft(duration * 60);
      
      toast.success('Work session completed! Time for a break.');
      
      if (settings.auto_start_breaks) {
        setTimeout(() => startSession(nextSessionType), 1000);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.work_duration * 60);
      toast.success('Break finished! Ready for another session?');
      
      if (settings.auto_start_pomodoros) {
        setTimeout(() => startSession('work'), 1000);
      }
    }
  };

  const startSession = async (type: SessionType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const duration = type === 'work' 
      ? settings.work_duration 
      : type === 'short_break'
      ? settings.short_break_duration
      : settings.long_break_duration;

    const { data: session } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        task_id: selectedTask || null,
        duration_minutes: duration,
        session_type: type,
        completed: false
      })
      .select()
      .single();

    if (session) {
      setCurrentSessionId(session.id);
      setIsRunning(true);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && !currentSessionId) {
      startSession(sessionType);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const skipSession = () => {
    if (currentSessionId) {
      supabase
        .from('pomodoro_sessions')
        .update({ completed: false, ended_at: new Date().toISOString() })
        .eq('id', currentSessionId);
    }
    
    setIsRunning(false);
    setCurrentSessionId(null);
    
    if (sessionType === 'work') {
      setSessionType('short_break');
      setTimeLeft(settings.short_break_duration * 60);
    } else {
      setSessionType('work');
      setTimeLeft(settings.work_duration * 60);
    }
  };

  const saveSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('pomodoro_settings')
      .upsert({
        user_id: user.id,
        ...settings
      });

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved');
      setTimeLeft(settings.work_duration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'work': return 'Focus Time';
      case 'short_break': return 'Short Break';
      case 'long_break': return 'Long Break';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pomodoro Focus</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Pomodoro Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Work Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.work_duration}
                    onChange={(e) => setSettings({ ...settings, work_duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Short Break (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.short_break_duration}
                    onChange={(e) => setSettings({ ...settings, short_break_duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Long Break (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.long_break_duration}
                    onChange={(e) => setSettings({ ...settings, long_break_duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Sessions before long break</Label>
                  <Input
                    type="number"
                    value={settings.sessions_before_long_break}
                    onChange={(e) => setSettings({ ...settings, sessions_before_long_break: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-start breaks</Label>
                  <Switch
                    checked={settings.auto_start_breaks}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_start_breaks: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-start pomodoros</Label>
                  <Switch
                    checked={settings.auto_start_pomodoros}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_start_pomodoros: checked })}
                  />
                </div>
                <Button onClick={saveSettings} className="w-full">Save Settings</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="p-8 text-center space-y-6">
          <h2 className="text-xl font-semibold text-muted-foreground">{getSessionTitle()}</h2>
          <div className="text-8xl font-bold font-mono">{formatTime(timeLeft)}</div>
          
          <div className="space-y-4">
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="w-32"
              >
                {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={skipSession}
                disabled={!currentSessionId}
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Completed sessions: {completedSessions} / {settings.sessions_before_long_break}
            </p>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>💡 25 minutes of focused work, then a 5-minute break</p>
        </div>
      </div>
    </div>
  );
}