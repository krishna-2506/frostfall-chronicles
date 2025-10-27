import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Sparkles, Brain, ListTodo, Droplet, Scissors } from 'lucide-react';

export default function GlowUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overthinkingLevel, setOverthinkingLevel] = useState<number | null>(null);
  const [wastedTasks, setWastedTasks] = useState<number>(0);
  const [didSkincare, setDidSkincare] = useState(false);
  const [didHaircare, setDidHaircare] = useState(false);

  useEffect(() => {
    loadTodayData();
  }, []);

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
        setDidSkincare(data.did_skincare || false);
        setDidHaircare(data.did_haircare || false);
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
            <div className="flex items-center justify-between">
              <Label htmlFor="skincare" className="text-lg">
                Did you do your skincare routine today?
              </Label>
              <Switch
                id="skincare"
                checked={didSkincare}
                onCheckedChange={(checked) => {
                  setDidSkincare(checked);
                  saveData('did_skincare', checked);
                }}
              />
            </div>
          </Card>

          {/* Haircare */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scissors className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Haircare</h2>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="haircare" className="text-lg">
                Did you do your haircare routine today?
              </Label>
              <Switch
                id="haircare"
                checked={didHaircare}
                onCheckedChange={(checked) => {
                  setDidHaircare(checked);
                  saveData('did_haircare', checked);
                }}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
