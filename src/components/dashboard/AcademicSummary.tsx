import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import semesterData from '@/data/firstsem.json';

type SemesterData = {
  [courseName: string]: {
    credits: number;
    modules: {
      [moduleName: string]: string[];
    };
  };
};

export const AcademicSummary = () => {
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
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

      let total = 0;
      Object.values(semesterData as SemesterData).forEach((course) => {
        Object.values(course.modules).forEach((topics) => {
          total += topics.length;
        });
      });

      setCompletedCount(data?.length || 0);
      setTotalCount(total);
    } catch (error: any) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="border-tech/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-wider">
          <BookOpen className="h-5 w-5 text-tech" />
          Academic Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="animate-pulse">Loading...</div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Topics Completed</span>
                <span className="font-mono">
                  {completedCount} / {totalCount}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="text-right text-xs text-muted-foreground">
                {Math.round(percentage)}% Complete
              </div>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link to="/semester">View Full Dossier</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
