import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Sparkles, Brain, ListTodo, Droplet, Scissors } from 'lucide-react';

export default function GlowUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overthinkingLevel, setOverthinkingLevel] = useState<number | null>(null);
  const [wastedTasks, setWastedTasks] = useState<number>(0);
  const [skincareCount, setSkincareCount] = useState<number>(0);
  const [haircareCount, setHaircareCount] = useState<number>(0);
  const [weeklySkincareCount, setWeeklySkincareCount] = useState<number>(0);
  const [weeklyHaircareCount, setWeeklyHaircareCount] = useState<number>(0);

  useEffect(() => {
    loadTodayData();
    loadWeeklyData();
  }, []);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday is start of week
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString().split('T')[0];
  };

  const loadTodayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('glow_up_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setOverthinkingLevel(data.overthinking_level);
        setWastedTasks(data.wasted_tasks || 0);
        setSkincareCount(data.did_skincare || 0);
        setHaircareCount(data.did_haircare || 0);
      }
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const weekStart = getWeekStart();

      const { data, error } = await supabase
        .from('glow_up_logs')
        .select('did_skincare, did_haircare')
        .eq('user_id', user.id)
        .gte('log_date', weekStart);

      if (error) throw error;

      if (data) {
        const totalSkincare = data.reduce((sum, log) => sum + (log.did_skincare || 0), 0);
        const totalHaircare = data.reduce((sum, log) => sum + (log.did_haircare || 0), 0);
        setWeeklySkincareCount(totalSkincare);
        setWeeklyHaircareCount(totalHaircare);
      }
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (field: string, value: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const updateData: any = {
        user_id: user.id,
        log_date: today,
        [field]: value
      };

      const { error } = await supabase
        .from('glow_up_logs')
        .upsert(updateData, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;

      toast.success('Saved!');
    } catch (error: any) {
      toast.error('Failed to save');
    }
  };

  const incrementCount = async (field: 'did_skincare' | 'did_haircare') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Get current value for today
      const { data: existing } = await supabase
        .from('glow_up_logs')
        .select(field)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .maybeSingle();

      const currentValue = existing?.[field] || 0;
      const newValue = currentValue + 1;

      const updateData: any = {
        user_id: user.id,
        log_date: today,
        [field]: newValue
      };

      const { error } = await supabase
        .from('glow_up_logs')
        .upsert(updateData, {
          onConflict: 'user_id,log_date'
        });

      if (error) throw error;

      // Update local state
      if (field === 'did_skincare') {
        setSkincareCount(newValue);
        setWeeklySkincareCount(prev => prev + 1);
      } else {
        setHaircareCount(newValue);
        setWeeklyHaircareCount(prev => prev + 1);
      }

      toast.success('Count updated!');
    } catch (error: any) {
      toast.error('Failed to update count');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-frost)]">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Glow Up
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
            >
              Dashboard
            </Button>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Overthinking Meter */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Overthinking Level</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Rate your overthinking today (1-5)</p>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={overthinkingLevel === level ? "default" : "outline"}
                    onClick={() => {
                      setOverthinkingLevel(level);
                      saveData('overthinking_level', level);
                    }}
                    className="h-16"
                  >
                    {level}
                  </Button>
                ))}
              </div>
              {overthinkingLevel !== null && (
                <p className="text-center text-sm">
                  Current level: <span className="font-bold text-primary">{overthinkingLevel}/5</span>
                </p>
              )}
            </div>
          </Card>

          {/* Wasted Tasks Counter */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ListTodo className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Wasted Tasks</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How many tasks did overthinking cost you today?
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={wastedTasks}
                  onChange={(e) => setWastedTasks(parseInt(e.target.value) || 0)}
                  className="text-lg"
                />
                <Button
                  onClick={() => saveData('wasted_tasks', wastedTasks)}
                >
                  Save
                </Button>
              </div>
              <p className="text-center text-3xl font-bold text-primary">
                {wastedTasks} tasks
              </p>
            </div>
          </Card>

          {/* Skincare */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Droplet className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Skincare</h2>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">This week</p>
                <p className="text-4xl font-bold text-primary">
                  {weeklySkincareCount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">times</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">Today: {skincareCount}</span>
                <Button
                  onClick={() => incrementCount('did_skincare')}
                  size="sm"
                >
                  +1 Skincare
                </Button>
              </div>
            </div>
          </Card>

          {/* Haircare */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scissors className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Haircare</h2>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">This week</p>
                <p className="text-4xl font-bold text-primary">
                  {weeklyHaircareCount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">times</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">Today: {haircareCount}</span>
                <Button
                  onClick={() => incrementCount('did_haircare')}
                  size="sm"
                >
                  +1 Haircare
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
