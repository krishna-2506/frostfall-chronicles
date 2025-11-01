import { Countdown } from '@/components/Countdown';
import { CourseTracker } from '@/components/CourseTracker';
import { DailyLog } from '@/components/DailyLog';
import { DayRatingTracker } from '@/components/DayRatingTracker';
import { ActiveMission } from '@/components/ActiveMission';
import { DailyStreakTracker } from '@/components/DailyStreakTracker';
import { AcademicSummary } from '@/components/dashboard/AcademicSummary';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Countdown */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <Countdown />
        </div>
      </div>

      {/* Main Content - 3 Column Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Column 1: THE DAILY LOG */}
          <div className="space-y-6">
            <DailyLog />
          </div>

          {/* Column 2: THE ARC */}
          <div className="space-y-6">
            <AcademicSummary />
            <CourseTracker />
            <ActiveMission />
          </div>

          {/* Column 3: THE CHRONICLE */}
          <div className="space-y-6">
            <DailyStreakTracker />
            <DayRatingTracker />
          </div>
        </div>
      </main>
    </div>
  );
}
