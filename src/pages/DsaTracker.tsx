import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import courseData from '@/data/dsa_playlist.json';
import { Code2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Video {
  name: string;
  duration_seconds: number;
  duration_formatted: string;
}

type CourseData = {
  [sectionName: string]: Video[];
};

export default function DsaTracker() {
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
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
        .select('section_name, video_name')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (error) throw error;

      const completed = new Set(
        data?.map(item => `${item.section_name}|||${item.video_name}`) || []
      );
      setCompletedVideos(completed);
    } catch (error: any) {
      console.error('Failed to load progress:', error);
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

        await supabase.rpc('award_xp', {
          amount_to_add: 5,
          action_source: `dsa: ${videoName.substring(0, 30)}...`,
        });
        toast.success('+5 XP');
      }
    } catch (error: any) {
      toast.error('Failed to update progress');
    }
  };

  const calculateProgress = () => {
    const totalVideos = Object.values(courseData as CourseData).flat().length;
    return totalVideos > 0 ? (completedVideos.size / totalVideos) * 100 : 0;
  };

  const calculateSectionProgress = (sectionName: string, videos: Video[]) => {
    const completed = videos.filter(v =>
      completedVideos.has(`${sectionName}|||${v.name}`)
    ).length;
    return videos.length > 0 ? (completed / videos.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  const percentage = calculateProgress();
  const totalVideos = Object.values(courseData as CourseData).flat().length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Code2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold uppercase tracking-wider">
              Algorithm Combat Log
            </h1>
          </div>
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-mono">
                    {completedVideos.size} / {totalVideos} lectures
                  </span>
                </div>
                <Progress value={percentage} className="h-3" />
                <div className="text-right text-xs text-muted-foreground">
                  {Math.round(percentage)}% Complete
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {Object.entries(courseData as CourseData).map(([section, videos]) => {
            const progress = calculateSectionProgress(section, videos);

            return (
              <AccordionItem key={section} value={section} className="border-primary/20">
                <Card className="border-primary/20">
                  <AccordionTrigger className="hover:no-underline px-6 py-4">
                    <div className="flex w-full items-center justify-between pr-4">
                      <div className="text-left">
                        <h3 className="font-semibold uppercase tracking-wide">{section}</h3>
                        <div className="mt-2 flex items-center gap-4">
                          <Progress value={progress} className="h-2 w-48" />
                          <span className="text-sm text-primary font-mono">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-2 pt-2">
                      {videos.map((video) => {
                        const key = `${section}|||${video.name}`;
                        const isChecked = completedVideos.has(key);

                        return (
                          <div
                            key={video.name}
                            className="flex items-start gap-3 rounded-md border border-border/50 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
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
                              <div className="text-xs text-muted-foreground">
                                {video.duration_formatted}
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
