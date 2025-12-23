import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import courseData from '@/data/course_tracker.json';
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

export default function DsCourse() {
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
          action_source: `video: ${videoName.substring(0, 30)}...`,
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">ML Course</h1>
        <p className="text-muted-foreground text-sm mt-1">Machine Learning Progress</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="tabular-nums">{completedVideos.size} / {totalVideos}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-3">
        {Object.entries(courseData as CourseData).map(([section, videos]) => {
          const progress = calculateSectionProgress(section, videos);

          return (
            <AccordionItem key={section} value={section} className="border-none">
              <Card className="border-border/50">
                <AccordionTrigger className="hover:no-underline px-4 py-3">
                  <div className="flex w-full items-center justify-between pr-4">
                    <div className="text-left flex-1">
                      <h3 className="font-medium text-sm">{section}</h3>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={progress} className="h-1.5 w-32" />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-1 pt-2">
                    {videos.map((video) => {
                      const key = `${section}|||${video.name}`;
                      const isChecked = completedVideos.has(key);

                      return (
                        <div
                          key={video.name}
                          className="flex items-center gap-3 rounded-md py-2 px-2 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={key}
                            checked={isChecked}
                            onCheckedChange={() => toggleVideo(section, video.name)}
                          />
                          <label
                            htmlFor={key}
                            className={`flex-1 cursor-pointer text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {video.name}
                          </label>
                          <span className="text-xs text-muted-foreground">{video.duration_formatted}</span>
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
  );
}
