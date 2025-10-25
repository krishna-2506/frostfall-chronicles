import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Snowflake } from 'lucide-react';

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
    <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
      <div className="absolute -right-4 -top-4 opacity-10">
        <Snowflake className="h-32 w-32 text-primary" />
      </div>
      
      <div className="relative">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Winter Arc Countdown
        </h2>
        
        <div className="grid grid-cols-4 gap-4 text-center">
          {Object.entries(timeLeft).map(([unit, value]) => (
            <div key={unit} className="space-y-2">
              <div className="rounded-lg bg-secondary/50 p-4 backdrop-blur-sm">
                <div className="text-3xl font-bold text-primary">
                  {value.toString().padStart(2, '0')}
                </div>
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {unit}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Until May 26, 2026
        </p>
      </div>
    </Card>
  );
};
