import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Play, Pause, SkipForward, Settings, Maximize2, Bell, Target, Shield, Crosshair } from "lucide-react";
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
  // Refs to avoid stale state in PiP animation
  const timeLeftRef = useRef(timeLeft);
  const isRunningRef = useRef(isRunning);
  const sessionTypeRef = useRef<SessionType>(sessionType);
  const settingsRef = useRef(settings);

  useEffect(() => {
    loadSettings();
    loadTasks();
    requestNotificationPermission();
    
    // Create audio element for notification
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2W66+ifUhELTqXh8LdlHQQ0j9nyy3ooBS55y/LahTcJF2W67+mjUhELTKPf8Ldk');
    
    // Track user activity
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
          
          // Send notification at 5 minutes remaining
          if (prev === 300 && sessionType === 'work') {
            sendNotification('⚠️ MISSION CRITICAL', 'T-minus 5 minutes until mission completion. Stay focused, agent!');
          }
          
          // Send notification at 1 minute remaining
          if (prev === 60 && sessionType === 'work') {
            sendNotification('🎯 FINAL COUNTDOWN', 'One minute remaining. Execute with precision!');
          }
          
          return prev - 1;
        });
      }, 1000);
      
      // Schedule random inactivity checks during work sessions
      if (sessionType === 'work') {
        const scheduleInactivityCheck = () => {
          if (inactivityCheckRef.current) clearTimeout(inactivityCheckRef.current);
          
          let nextCheckMinutes: number;
          if (inactivityCheckCountRef.current === 0) {
            nextCheckMinutes = 15; // First check at 15 minutes
          } else if (inactivityCheckCountRef.current === 1) {
            nextCheckMinutes = 25; // Second check at 25 minutes
          } else {
            // Random between 20-40 minutes for subsequent checks
            nextCheckMinutes = Math.floor(Math.random() * 21) + 20;
          }
          
          inactivityCheckRef.current = setTimeout(() => {
            const inactiveMinutes = (Date.now() - lastActivityRef.current) / 1000 / 60;
            if (inactiveMinutes >= nextCheckMinutes) {
              sendNotification('🔴 MISSION STATUS: COMPROMISED', 'Agent, we have detected no activity. Confirm mission status immediately.');
              setShowInactivityAlert(true);
              setIsRunning(false);
            }
            inactivityCheckCountRef.current++;
            scheduleInactivityCheck(); // Schedule next check
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

  // Keep refs in sync to avoid stale state in PiP animation
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
      // Create default settings
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
      new Notification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
    }
  };

  const loadTasks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try active mission first
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

    // Fallback: show all incomplete tasks for the user
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
      
      // Award XP for completed pomodoro
      await supabase.rpc('award_xp', { 
        amount_to_add: 50, 
        action_source: 'mission_completed' 
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
      
      sendNotification('🎯 MISSION ACCOMPLISHED', `Operation complete! You've earned 50 XP, agent!`);
      toast.success('🎯 Mission Complete! +50 XP');
      
      if (nextSessionType === 'long_break') {
        sendNotification('🔋 EXTENDED RECHARGE', `Outstanding work, agent. ${settings.long_break_duration} minute debrief authorized.`);
      }
      
      if (settings.auto_start_breaks) {
        setTimeout(() => startSession(nextSessionType), 1000);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.work_duration * 60);
      sendNotification('✅ Recovery Complete', 'Agent recharged. Ready for next operation.');
      toast.success('Break complete! Ready for next mission');
      
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
      
      const title = type === 'work' ? 'Focus Time Started!' : 'Break Time Started!';
      const body = type === 'work' 
        ? `${duration} minutes of focused work ahead. You've got this!`
        : `${duration} minutes to relax and recharge.`;
      sendNotification(title, body);
    }
  };

  const drawTimerOnCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Mission Impossible themed gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a0a0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate progress using refs (prevents stale state)
    const st = sessionTypeRef.current;
    const s = settingsRef.current;
    const tl = timeLeftRef.current;

    const totalTime = st === 'work' 
      ? s.work_duration * 60 
      : st === 'short_break' 
      ? s.short_break_duration * 60 
      : s.long_break_duration * 60;
    const progress = ((totalTime - tl) / totalTime);

    // Draw progress arc
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (2 * Math.PI * progress));
    ctx.strokeStyle = st === 'work' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Draw session type
    ctx.fillStyle = st === 'work' ? '#ef4444' : '#fbbf24';
    ctx.font = 'bold 24px system-ui';
    ctx.textAlign = 'center';
    const sessionLabel = st === 'work' ? 'MISSION ACTIVE' : st === 'short_break' ? 'TACTICAL PAUSE' : 'RECHARGE';
    ctx.fillText(sessionLabel, centerX, centerY - 40);

    // Draw timer
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = st === 'work' ? '#ef4444' : '#fbbf24';
    ctx.fillText(formatTime(tl), centerX, centerY + 30);

    // Draw status
    ctx.font = '18px system-ui';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(isRunningRef.current ? '⏸ Running' : '▶ Paused', centerX, centerY + 70);
  };

  const openPictureInPicture = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Render once before capturing to ensure a frame exists
      drawTimerOnCanvas();

      // Set up canvas stream
      const stream = canvas.captureStream(30);
      video.srcObject = stream;
      video.muted = true;

      // Wait for metadata to avoid AbortError on play()
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) return resolve();
        video.onloadedmetadata = () => resolve();
      });

      await video.play().catch(() => {});

      // Enter PiP
      if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
        setIsPipActive(true);
        
        // Start animation loop
        const animate = () => {
          drawTimerOnCanvas();
          pipAnimationRef.current = requestAnimationFrame(animate);
        };
        animate();

        toast.success('Picture-in-Picture activated!');
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Failed to activate Picture-in-Picture');
    }
  };

  const closePictureInPicture = () => {
    if (pipAnimationRef.current) {
      cancelAnimationFrame(pipAnimationRef.current);
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    // Stop canvas stream tracks
    const v = videoRef.current;
    const ms = (v?.srcObject as MediaStream) || null;
    ms?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setIsPipActive(false);
  };

  const handleStillThere = () => {
    lastActivityRef.current = Date.now();
    inactivityCheckCountRef.current = 0; // Reset check counter
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

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'work': return '🎯 MISSION ACTIVE';
      case 'short_break': return '⏸️ TACTICAL PAUSE';
      case 'long_break': return '🔋 RECHARGE SEQUENCE';
    }
  };

  const getSessionSubtitle = () => {
    switch (sessionType) {
      case 'work': return 'Your mission, should you choose to accept it';
      case 'short_break': return 'Agent recovering... Stand by';
      case 'long_break': return 'Mission debrief in progress';
    }
  };

  // Handle PiP events
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

  // Update canvas when timer changes
  useEffect(() => {
    if (isPipActive) {
      drawTimerOnCanvas();
    }
  }, [timeLeft, isRunning, sessionType, isPipActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 p-6 relative overflow-hidden">
      {/* Mission Impossible Grid Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <AlertDialog open={showInactivityAlert} onOpenChange={setShowInactivityAlert}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              MISSION STATUS: COMPROMISED
            </AlertDialogTitle>
            <AlertDialogDescription>
              Agent, we've detected no activity. Mission abort protocol will initiate unless you confirm status immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleStillThere} className="bg-destructive hover:bg-destructive/90">
              MISSION ACTIVE - RESUMING
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider flex items-center gap-2">
              <Target className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-primary">TACTICAL FOCUS</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1 tracking-widest">
              CLASSIFIED OPERATION // LEVEL {completedSessions + 1}
            </p>
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
              title={isPipActive ? "Close Picture-in-Picture" : "Open Picture-in-Picture"}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="border-primary/20 bg-card">
              <DialogHeader>
                <DialogTitle className="uppercase tracking-wider text-primary font-mono">MISSION PARAMETERS</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-mono text-xs">WORK DURATION (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.work_duration}
                    onChange={(e) => setSettings({ ...settings, work_duration: parseInt(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">SHORT BREAK (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.short_break_duration}
                    onChange={(e) => setSettings({ ...settings, short_break_duration: parseInt(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">LONG BREAK (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.long_break_duration}
                    onChange={(e) => setSettings({ ...settings, long_break_duration: parseInt(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">SESSIONS BEFORE LONG BREAK</Label>
                  <Input
                    type="number"
                    value={settings.sessions_before_long_break}
                    onChange={(e) => setSettings({ ...settings, sessions_before_long_break: parseInt(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs">AUTO-START BREAKS</Label>
                  <Switch
                    checked={settings.auto_start_breaks}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_start_breaks: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs">AUTO-START MISSIONS</Label>
                  <Switch
                    checked={settings.auto_start_pomodoros}
                    onCheckedChange={(checked) => setSettings({ ...settings, auto_start_pomodoros: checked })}
                  />
                </div>
                <Button onClick={saveSettings} className="w-full uppercase tracking-wider">
                  Confirm Parameters
                </Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="p-8 text-center space-y-6 border-primary/30 bg-card shadow-[var(--shadow-tactical)] relative overflow-hidden">
          {/* Red line accent at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" style={{
            boxShadow: 'var(--glow-alert)'
          }} />
          
          {/* Top secret watermark */}
          <div className="absolute top-4 right-4 rotate-12 opacity-20">
            <span className="text-xs font-bold text-primary tracking-widest border border-primary px-2 py-1">
              TOP SECRET
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-primary">{getSessionTitle()}</h2>
            <p className="text-xs text-muted-foreground font-mono tracking-wider italic">
              {getSessionSubtitle()}
            </p>
          </div>

          {/* Timer display with crosshair */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Crosshair className="h-64 w-64 text-primary" />
            </div>
            <div className="text-8xl font-bold font-mono text-primary relative z-10 tracking-wider" style={{
              textShadow: 'var(--glow-alert)'
            }}>
              {formatTime(timeLeft)}
            </div>
            {sessionType === 'work' && timeLeft <= 300 && timeLeft > 0 && (
              <div className="text-sm text-primary font-mono mt-2 animate-pulse">
                ⚠️ MISSION CRITICAL - {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} REMAINING
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
              <Label className="text-xs font-mono text-muted-foreground tracking-wider">SELECT MISSION OBJECTIVE</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger className="mt-2 font-mono">
                  <SelectValue placeholder="[CLASSIFIED] - Choose target..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.length === 0 ? (
                    <SelectItem disabled value="no-tasks">No active missions available</SelectItem>
                  ) : (
                    tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id} className="font-mono">
                        🎯 {task.description}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="w-40 uppercase tracking-wider bg-primary hover:bg-primary/90 font-bold shadow-[var(--glow-alert)] border border-primary/50"
              >
                {isRunning ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                {isRunning ? 'PAUSE' : 'INITIATE'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={skipSession}
                disabled={!currentSessionId}
                className="uppercase tracking-wider border-primary/50 hover:bg-primary/10"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                ABORT
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-primary/20">
            <div className="flex items-center justify-center gap-2 text-sm font-mono">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                OPERATIONS COMPLETED: <span className="text-primary font-bold">{completedSessions}</span> / {settings.sessions_before_long_break}
              </span>
            </div>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground font-mono tracking-wider border border-primary/10 rounded-lg p-4 bg-card/30 backdrop-blur">
          <p className="flex items-center justify-center gap-2">
            <Target className="h-3 w-3 text-primary" />
            This message will self-destruct after {settings.work_duration} minutes of focused work
          </p>
        </div>
      </div>

      {/* Hidden canvas and video for PiP */}
      <canvas ref={canvasRef} width="640" height="360" style={{ display: 'none' }} />
      <video ref={videoRef} muted style={{ display: 'none' }} />
    </div>
  );
}