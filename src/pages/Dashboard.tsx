import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Snowflake } from 'lucide-react';
import { Countdown } from '@/components/Countdown';
import { CourseTracker } from '@/components/CourseTracker';
import { HealthTracker } from '@/components/HealthTracker';
import { StreakTracker } from '@/components/StreakTracker';

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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Countdown */}
          <Countdown />

          {/* Course Tracker */}
          <CourseTracker />

          {/* Health Tracker */}
          <HealthTracker />

          {/* Streak Tracker */}
          <StreakTracker />
        </div>
      </main>
    </div>
  );
}
