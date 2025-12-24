import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Pause, SkipForward, Settings, Maximize2, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [showInactivityAlert, setShowInactivityAlert] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCheckCountRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipAnimationRef = useRef<number | null>(null);
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  const sessionTypeRef = useRef<SessionType>(sessionType);
  const settingsRef = useRef(settings);

  useEffect(() => {
    loadSettings();
    loadTasks();
    requestNotificationPermission();
    
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2W66+ifUhELTqXh8LdlHQQ0j9nyy3ooBS55y/LahTcJF2W67+mjUhELTKPf8Ldk');
    
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          
          if (prev === 300 && sessionType === 'work') {
            sendNotification('5 minutes left', 'Keep going!');
          }
          
          if (prev === 60 && sessionType === 'work') {
            sendNotification('1 minute left', 'Almost there!');
          }
          
          return prev - 1;
        });
      }, 1000);
      
      if (sessionType === 'work') {
        const scheduleInactivityCheck = () => {
          if (inactivityCheckRef.current) clearTimeout(inactivityCheckRef.current);
          
          let nextCheckMinutes: number;
          if (inactivityCheckCountRef.current === 0) {
            nextCheckMinutes = 15;
          } else if (inactivityCheckCountRef.current === 1) {
            nextCheckMinutes = 25;
          } else {
            nextCheckMinutes = Math.floor(Math.random() * 21) + 20;
          }
          
          inactivityCheckRef.current = setTimeout(() => {
            const inactiveMinutes = (Date.now() - lastActivityRef.current) / 1000 / 60;
            if (inactiveMinutes >= nextCheckMinutes) {
              sendNotification('Still there?', 'No activity detected. Timer paused.');
              setShowInactivityAlert(true);
              setIsRunning(false);
            }
            inactivityCheckCountRef.current++;
            scheduleInactivityCheck();
          }, nextCheckMinutes * 60 * 1000);
        };
        
        scheduleInactivityCheck();
      }
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (inactivityCheckRef.current) clearInterval(inactivityCheckRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (inactivityCheckRef.current) clearInterval(inactivityCheckRef.current);
    };
  }, [isRunning, sessionType]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
    isRunningRef.current = isRunning;
    sessionTypeRef.current = sessionType;
    settingsRef.current = settings;
  }, [timeLeft, isRunning, sessionType, settings]);

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
      await supabase.from('pomodoro_settings').insert({
        user_id: user.id,
        ...settings
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, { body, icon: '/favicon.ico' });
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

      if (tasksData && tasksData.length > 0) {
        setTasks(tasksData);
        return;
      }
    }

    const { data: allTasks } = await supabase
      .from('mission_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .order('created_at', { ascending: false });

    if (allTasks) setTasks(allTasks);
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
      
      await supabase.rpc('award_xp', { 
        amount_to_add: 50, 
        action_source: 'pomodoro_completed' 
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
      
      sendNotification('Session complete!', 'You earned 50 XP. Take a break.');
      toast.success('Session complete! +50 XP');
      
      if (settings.auto_start_breaks) {
        setTimeout(() => startSession(nextSessionType), 1000);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.work_duration * 60);
      sendNotification('Break over', 'Ready for another session?');
      toast.success('Break complete!');
      
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
      lastActivityRef.current = Date.now();
      
      const title = type === 'work' ? 'Focus started' : 'Break started';
      sendNotification(title, `${duration} minutes`);
    }
  };

  const drawTimerOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const st = sessionTypeRef.current;
    const s = settingsRef.current;
    const tl = timeLeftRef.current;

    const totalTime = st === 'work' 
      ? s.work_duration * 60 
      : st === 'short_break' 
      ? s.short_break_duration * 60 
      : s.long_break_duration * 60;
    const progress = ((totalTime - tl) / totalTime);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    // Progress arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress));
    ctx.strokeStyle = st === 'work' ? '#3b82f6' : '#22c55e';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Session type label
    ctx.fillStyle = st === 'work' ? '#3b82f6' : '#22c55e';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    const sessionLabel = st === 'work' ? 'Focus' : st === 'short_break' ? 'Short Break' : 'Long Break';
    ctx.fillText(sessionLabel, centerX, centerY - 35);

    // Timer
    ctx.font = 'bold 64px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(formatTime(tl), centerX, centerY + 25);

    // Status
    ctx.font = '16px system-ui';
    ctx.fillStyle = '#888888';
    ctx.fillText(isRunningRef.current ? 'Running' : 'Paused', centerX, centerY + 60);
  };

  const openPictureInPicture = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      drawTimerOnCanvas();

      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.muted = true;

      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) return resolve();
        video.onloadedmetadata = () => resolve();
      });

      await video.play().catch(() => {});

      if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
        
        const animate = () => {
          drawTimerOnCanvas();
          pipAnimationRef.current = requestAnimationFrame(animate);
        };
        animate();

        toast.success('Picture-in-Picture activated');
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Failed to activate PiP');
    }
  };

  const closePictureInPicture = () => {
    if (pipAnimationRef.current) {
      cancelAnimationFrame(pipAnimationRef.current);
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    const v = videoRef.current;
    const ms = (v?.srcObject as MediaStream) || null;
    ms?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setIsPipActive(false);
  };

  const handleStillThere = () => {
    lastActivityRef.current = Date.now();
    inactivityCheckCountRef.current = 0;
    setShowInactivityAlert(false);
    setIsRunning(true);
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

  const getSessionLabel = () => {
    switch (sessionType) {
      case 'work': return 'Focus';
      case 'short_break': return 'Short Break';
      case 'long_break': return 'Long Break';
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLeavePip = () => {
      setIsPipActive(false);
      if (pipAnimationRef.current) {
        cancelAnimationFrame(pipAnimationRef.current);
      }
    };

    video.addEventListener('leavepictureinpicture', handleLeavePip);
    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePip);
    };
  }, []);

  useEffect(() => {
    if (isPipActive) {
      drawTimerOnCanvas();
    }
  }, [timeLeft, isRunning, sessionType, isPipActive]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <AlertDialog open={showInactivityAlert} onOpenChange={setShowInactivityAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Still there?</AlertDialogTitle>
            <AlertDialogDescription>
              No activity detected. Your timer has been paused.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStillThere}>
              I'm here, resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Focus</h1>
          <p className="text-sm text-muted-foreground">Pomodoro timer</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={requestNotificationPermission}
            title="Enable Notifications"
          >
            <Bell className={`h-4 w-4 ${notificationsEnabled ? 'text-primary' : ''}`} />
          </Button>
          <Button 
            variant={isPipActive ? "default" : "outline"}
            size="icon"
            onClick={isPipActive ? closePictureInPicture : openPictureInPicture}
            title={isPipActive ? "Close PiP" : "Open PiP"}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Work duration (min)</Label>
                  <Input
                    type="number"
                    value={settings.work_duration}
                    onChange={(e) => setSettings({ ...settings, work_duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Short break (min)</Label>
                  <Input
                    type="number"
                    value={settings.short_break_duration}
                    onChange={(e) => setSettings({ ...settings, short_break_duration: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Long break (min)</Label>
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
                  <Label>Auto-start work</Label>
                  <Switch
                    checked={settings.auto_start_pomodoros}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_start_pomodoros: checked })}
                  />
                </div>
                <Button onClick={saveSettings} className="w-full">
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-8 text-center space-y-6">
        <div>
          <span className={`text-sm font-medium ${sessionType === 'work' ? 'text-primary' : 'text-green-500'}`}>
            {getSessionLabel()}
          </span>
        </div>

        <div className="text-7xl font-bold font-mono tracking-wider">
          {formatTime(timeLeft)}
        </div>
        
        <div className="space-y-4">
          <Select value={selectedTask} onValueChange={setSelectedTask}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task (optional)" />
            </SelectTrigger>
            <SelectContent>
              {tasks.length === 0 ? (
                <SelectItem disabled value="no-tasks">No tasks available</SelectItem>
              ) : (
                tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.description}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={toggleTimer} className="w-32">
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

        <div className="text-sm text-muted-foreground">
          Sessions: {completedSessions} / {settings.sessions_before_long_break}
        </div>
      </Card>

      <canvas ref={canvasRef} width="640" height="360" style={{ display: 'none' }} />
      <video ref={videoRef} muted style={{ display: 'none' }} />
    </div>
  );
}
