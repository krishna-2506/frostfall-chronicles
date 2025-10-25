import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import courseData from '@/data/course_tracker.json';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Video {
  name: string;
  duration_seconds: number;
  duration_formatted: string;
}

export const CourseTracker = () => {
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('course_progress')
        .select('section_name, video_name, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      const completed = new Set(
        data?.map(item => `${item.section_name}|||${item.video_name}`) || []
      );
      setCompletedVideos(completed);
    } catch (error: any) {
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = async (sectionName: string, videoName: string) => {
    const key = `${sectionName}|||${videoName}`;
    const isCompleted = completedVideos.has(key);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isCompleted) {
        const { error } = await supabase
          .from('course_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('section_name', sectionName)
          .eq('video_name', videoName);

        if (error) throw error;

        setCompletedVideos(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('course_progress')
          .upsert({
            user_id: user.id,
            section_name: sectionName,
            video_name: videoName,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;

        setCompletedVideos(prev => new Set(prev).add(key));
      }
    } catch (error: any) {
      toast.error('Failed to update progress');
    }
  };

  const calculateSectionProgress = (sectionName: string, videos: Video[]) => {
    const completed = videos.filter(v => 
      completedVideos.has(`${sectionName}|||${v.name}`)
    ).length;
    return (completed / videos.length) * 100;
  };

  const totalVideos = Object.values(courseData).flat().length;
  const completedCount = completedVideos.size;
  const overallProgress = (completedCount / totalVideos) * 100;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-card/50 p-6 shadow-[var(--glow-soft)]">
      <div className="mb-6 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Course Progress</h2>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-semibold text-primary">{completedCount} / {totalVideos} videos</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      <div className="space-y-3">
        {Object.entries(courseData).map(([section, videos]) => {
          const progress = calculateSectionProgress(section, videos as Video[]);
          const isExpanded = expandedSections.has(section);

          return (
            <Collapsible key={section} open={isExpanded} onOpenChange={() => toggleSection(section)}>
              <div className="rounded-lg border border-border bg-secondary/30 backdrop-blur-sm">
                <CollapsibleTrigger className="w-full p-4 text-left transition-colors hover:bg-secondary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{section}</span>
                    </div>
                    <span className="text-sm text-primary font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="mt-2 h-1.5" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border p-4 space-y-2">
                    {(videos as Video[]).map((video) => {
                      const key = `${section}|||${video.name}`;
                      const isChecked = completedVideos.has(key);

                      return (
                        <div
                          key={video.name}
                          className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-secondary/50"
                        >
                          <Checkbox
                            id={key}
                            checked={isChecked}
                            onCheckedChange={() => toggleVideo(section, video.name)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={key}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            <div className={isChecked ? 'line-through text-muted-foreground' : ''}>
                              {video.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{video.duration_formatted}</div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </Card>
  );
};
