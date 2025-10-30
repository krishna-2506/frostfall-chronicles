import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Shield, Timer, BookOpen, Activity, Flame, Target, Zap, Star, Sparkles } from 'lucide-react';
import { Countdown } from '@/components/Countdown';
import { CourseTracker } from '@/components/CourseTracker';
import { HealthTracker } from '@/components/HealthTracker';
import { WorkHoursTracker } from '@/components/WorkHoursTracker';
import { StreakTracker } from '@/components/StreakTracker';
import { NoFapStreakTracker } from '@/components/NoFapStreakTracker';
import { DayRatingTracker } from '@/components/DayRatingTracker';
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
      <header className="relative border-b border-border bg-card backdrop-blur-sm shadow-[var(--shadow-tactical)]">
        <div className="absolute right-8 top-2 rotate-12 opacity-30">
          <span className="text-xs font-bold text-primary tracking-widest border-2 border-primary px-2 py-1">
            CLASSIFIED
          </span>
        </div>
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-gradient-alert shadow-[var(--glow-alert)]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground uppercase">
                Mission Impossible
              </h1>
              <p className="text-xs text-muted-foreground font-mono">WINTER ARC PROTOCOL</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Extract
          </Button>
        </div>
      </header>

      {/* Navigation Buttons */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">Mission Control</p>
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
              onClick={() => scrollToSection('nofap-streak-section')}
              className="gap-2"
            >
              <Zap className="h-3.5 w-3.5" />
              NoFap
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scrollToSection('day-rating-section')}
              className="gap-2"
            >
              <Star className="h-3.5 w-3.5" />
              Rating
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/glow-up')}
              className="gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Glow Up
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

          {/* NoFap Streak Tracker */}
          <div id="nofap-streak-section">
            <NoFapStreakTracker />
          </div>

          {/* Day Rating */}
          <div id="day-rating-section">
            <DayRatingTracker />
          </div>

          {/* Perfect Day Counter */}
          <PerfectDayCounter />
        </div>
      </main>
    </div>
  );
}
