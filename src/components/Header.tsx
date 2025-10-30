import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LogOut, User } from 'lucide-react';
import { LevelTracker } from './LevelTracker';
import { PerfectDayCounter } from './PerfectDayCounter';

export const Header = () => {
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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${
      isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold uppercase tracking-tight">
            Frostfall Chronicles
          </h1>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/missions" className={navLinkClass}>
              Missions
            </NavLink>
            <NavLink to="/glow-up" className={navLinkClass}>
              Mental Ops
            </NavLink>
          </nav>
        </div>

        {/* Right: Player HUD */}
        <div className="flex items-center gap-4">
          <PerfectDayCounter />
          <LevelTracker />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
