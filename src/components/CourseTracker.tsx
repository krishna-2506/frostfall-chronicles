import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import courseData from '@/data/course_tracker.json';
import { Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Video {
  name: string;
  duration_seconds: number;
  duration_formatted: string;
}

type CourseData = {
  [sectionName: string]: Video[];
};

export const CourseTracker = () => {
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [nextTopics, setNextTopics] = useState<{ section: string; video: Video }[]>([]);

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

      // Find next uncompleted topics
      const next: { section: string; video: Video }[] = [];
      for (const [section, videos] of Object.entries(courseData as CourseData)) {
        for (const video of videos) {
          const key = `${section}|||${video.name}`;
          if (!completed.has(key)) {
            next.push({ section, video });
            if (next.length >= 5) break;
          }
        }
        if (next.length >= 5) break;
      }
      setNextTopics(next);
    } catch (error: any) {
      console.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const totalVideos = Object.values(courseData as CourseData).flat().length;
  const completedCount = completedVideos.size;
  const overallProgress = (completedCount / totalVideos) * 100;

  if (loading) {
    return (
      <Card className="border-tech/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-tech/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-wider">
          <Terminal className="h-5 w-5 text-tech" />
          Data Arsenal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-mono">
              {completedCount} / {totalVideos} videos
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="text-right text-xs text-muted-foreground">
            {Math.round(overallProgress)}% Complete
          </div>
        </div>

        {nextTopics.length > 0 && (
          <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Next Targets
            </div>
            {nextTopics.map(({ section, video }, idx) => (
              <div key={`${section}|||${video.name}`} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-mono">{idx + 1}.</span>
                  <div className="flex-1">
                    <div className="font-medium">{video.name}</div>
                    <div className="text-xs text-muted-foreground">{section}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button asChild className="w-full" variant="outline">
          <Link to="/ds-course">View Full Arsenal</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
