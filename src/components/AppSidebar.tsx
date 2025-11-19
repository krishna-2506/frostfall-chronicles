import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  Target,
  Crosshair,
  Radio,
  FileText,
  GraduationCap,
  Code2,
  Activity,
  Dumbbell,
  Brain,
  BarChart3,
  BookOpen,
  LogOut,
  User,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGamification } from '@/contexts/GamificationContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const menuGroups = [
  {
    label: 'COMMAND',
    items: [
      { title: 'Mission Control', url: '/', icon: Shield },
      { title: 'Focus Mode', url: '/focus', icon: Crosshair },
      { title: 'Mission Objectives', url: '/tasks', icon: Target },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { title: 'Active Missions', url: '/missions', icon: Radio },
      { title: 'XP Ledger', url: '/xp-log', icon: FileText },
    ],
  },
  {
    label: 'INTEL',
    items: [
      { title: 'Academics', url: '/semester', icon: GraduationCap },
      { title: 'DS Course', url: '/ds-course', icon: BookOpen },
      { title: 'Algorithm Warfare', url: '/dsa-tracker', icon: Code2 },
    ],
  },
  {
    label: 'VITALS',
    items: [
      { title: 'Health Center', url: '/health', icon: Activity },
      { title: 'Gym Arsenal', url: '/health#gym', icon: Dumbbell },
      { title: 'Mental Ops', url: '/glow-up', icon: Brain },
    ],
  },
  {
    label: 'ARCHIVES',
    items: [
      { title: 'Statistics', url: '/statistics', icon: BarChart3 },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { level, totalXp, progressPercentage } = useGamification();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Session terminated');
      navigate('/auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  return (
    <Sidebar className="border-r border-primary/20 bg-card/95 backdrop-blur">
      <SidebarHeader className="border-b border-primary/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          {state !== 'collapsed' && (
            <div className="flex flex-col">
              <span className="text-sm font-mono font-bold text-primary tracking-wider">
                WINTER ARC
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                TACTICAL OPERATIONS
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-mono text-primary/60 tracking-widest">
              {state !== 'collapsed' && group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`
                          font-mono text-xs
                          ${isActive 
                            ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                          }
                        `}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          {state !== 'collapsed' && <span>{item.title}</span>}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-primary/10 p-4">
        {state !== 'collapsed' ? (
          <div className="space-y-4">
            {/* Level Display */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">OPERATOR LEVEL</span>
                <span className="text-lg font-bold font-mono text-primary">{level}</span>
              </div>
              <Progress value={progressPercentage} className="h-1.5" />
              <div className="mt-1 text-[9px] font-mono text-muted-foreground text-right">
                {totalXp} XP
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-foreground truncate">OPERATOR</div>
                <div className="text-[10px] text-muted-foreground font-mono">ACTIVE</div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
              <span className="text-sm font-bold font-mono text-primary">{level}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
