import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Snowflake, Timer, BookOpen, Activity, Flame, Target } from 'lucide-react';
import { Countdown } from '@/components/Countdown';
import { CourseTracker } from '@/components/CourseTracker';
import { HealthTracker } from '@/components/HealthTracker';
import { WorkHoursTracker } from '@/components/WorkHoursTracker';
import { StreakTracker } from '@/components/StreakTracker';
import { PerfectDayCounter } from '@/components/PerfectDayCounter';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Failed to log out');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-frost)]">
              <Snowflake className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Winter Arc
            </h1>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Navigation Buttons */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('countdown-section')}
              className="gap-2"
            >
              <Timer className="h-3.5 w-3.5" />
              Countdown
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('course-tracker-section')}
              className="gap-2"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Course
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('health-tracker-section')}
              className="gap-2"
            >
              <Activity className="h-3.5 w-3.5" />
              Health
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('streak-section')}
              className="gap-2"
            >
              <Flame className="h-3.5 w-3.5" />
              Streak
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/missions')}
              className="gap-2"
            >
              <Target className="h-3.5 w-3.5" />
              Missions
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Countdown */}
          <div id="countdown-section">
            <Countdown />
          </div>

          {/* Course Tracker */}
          <div id="course-tracker-section">
            <CourseTracker />
          </div>

          {/* Health & Work Trackers */}
          <div id="health-tracker-section" className="grid gap-6 md:grid-cols-2">
            <HealthTracker />
            <WorkHoursTracker />
          </div>

          {/* Streak Tracker */}
          <div id="streak-section">
            <StreakTracker />
          </div>

          {/* Perfect Day Counter */}
          <PerfectDayCounter />
        </div>
      </main>
    </div>
  );
}
