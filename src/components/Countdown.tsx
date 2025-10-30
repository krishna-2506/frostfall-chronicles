import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export const Countdown = () => {
  const targetDate = new Date('2026-05-26T00:00:00');
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="relative overflow-hidden border-primary/50 bg-card p-6 shadow-[var(--shadow-tactical)]">
      <div className="absolute -right-4 -top-4 opacity-5">
        <Clock className="h-32 w-32 text-primary" />
      </div>
      
      <div className="absolute top-4 right-4 rotate-12">
        <span className="text-[10px] font-bold text-primary tracking-widest border border-primary px-1.5 py-0.5 opacity-40">
          CLASSIFIED
        </span>
      </div>
      
      <div className="relative">
        <div className="mb-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
            Operation Timer
          </span>
        </div>
        <h2 className="mb-6 text-2xl font-bold tracking-tight uppercase">
          Mission Deadline
        </h2>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="space-y-2">
              <div className="rounded-sm bg-gradient-alert p-4 shadow-[var(--glow-alert)]">
                <div className="text-3xl font-bold text-white font-mono">
                  {value.toString().padStart(2, '0')}
                </div>
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">
                {unit}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            Target Date: May 26, 2026
          </p>
          <p className="text-xs text-success font-semibold mt-1">
            MISSION ACTIVE
          </p>
        </div>
      </div>
    </Card>
  );
};
