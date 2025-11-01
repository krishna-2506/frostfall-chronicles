import { VitalsMonitor } from '@/components/VitalsMonitor';
import { DailyStreakTracker } from '@/components/DailyStreakTracker';
import { StreakTracker } from '@/components/StreakTracker';
import { NoFapStreakTracker } from '@/components/NoFapStreakTracker';
import { Activity } from 'lucide-react';

export default function Health() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold uppercase tracking-wider">
              Health Command Center
            </h1>
          </div>
          <p className="text-muted-foreground">
            Track your physical performance and discipline streaks
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Vitals Monitor - Takes 2 columns */}
          <div className="lg:col-span-2">
            <VitalsMonitor />
          </div>

          {/* Streak Trackers - Stacked in 1 column */}
          <div className="space-y-6">
            <DailyStreakTracker />
            <StreakTracker />
            <NoFapStreakTracker />
          </div>
        </div>
      </div>
    </div>
  );
}
