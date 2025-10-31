import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import semesterData from '@/data/firstsem.json';

type SemesterData = {
  [courseName: string]: {
    credits: number;
    modules: {
      [moduleName: string]: string[];
    };
  };
};

export default function Semester() {
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
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

      const completed = new Set<string>();
      data?.forEach((item) => {
        const key = `${item.section_name}|||${item.video_name}`;
        completed.add(key);
      });

      setCompletedTopics(completed);
    } catch (error: any) {
      console.error('Failed to load progress:', error);
      toast.error('Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const checkModuleCompletion = async (moduleName: string, allTopicsInModule: string[]) => {
    const allComplete = allTopicsInModule.every((topic) => {
      const key = `${moduleName}|||${topic}`;
      return completedTopics.has(key);
    });

    if (allComplete) {
      const { data } = await supabase
        .from('xp_logs')
        .select('id')
        .eq('source_action', `module_complete: ${moduleName}`)
        .limit(1);

      if (!data || data.length === 0) {
        await supabase.rpc('award_xp', {
          amount_to_add: 50,
          action_source: `module_complete: ${moduleName}`,
        });
        toast.success(`+50 XP bonus for completing ${moduleName}!`);
      }
    }
  };

  const toggleTopic = async (moduleName: string, topicName: string, allTopicsInModule: string[]) => {
    const key = `${moduleName}|||${topicName}`;
    const isCompleted = completedTopics.has(key);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isCompleted) {
        await supabase
          .from('course_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('section_name', moduleName)
          .eq('video_name', topicName);

        const newCompleted = new Set(completedTopics);
        newCompleted.delete(key);
        setCompletedTopics(newCompleted);
      } else {
        await supabase.from('course_progress').upsert({
          user_id: user.id,
          section_name: moduleName,
          video_name: topicName,
          completed: true,
        });

        const newCompleted = new Set(completedTopics);
        newCompleted.add(key);
        setCompletedTopics(newCompleted);

        await supabase.rpc('award_xp', {
          amount_to_add: 5,
          action_source: `topic: ${topicName.substring(0, 20)}...`,
        });
        toast.success('+5 XP');

        setTimeout(() => checkModuleCompletion(moduleName, allTopicsInModule), 500);
      }
    } catch (error: any) {
      console.error('Failed to toggle topic:', error);
      toast.error('Failed to update progress');
    }
  };

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;

    Object.values(semesterData as SemesterData).forEach((course) => {
      Object.entries(course.modules).forEach(([moduleName, topics]) => {
        topics.forEach((topic) => {
          total++;
          const key = `${moduleName}|||${topic}`;
          if (completedTopics.has(key)) completed++;
        });
      });
    });

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const calculateCourseProgress = (modules: { [key: string]: string[] }) => {
    let total = 0;
    let completed = 0;

    Object.entries(modules).forEach(([moduleName, topics]) => {
      topics.forEach((topic) => {
        total++;
        const key = `${moduleName}|||${topic}`;
        if (completedTopics.has(key)) completed++;
      });
    });

    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const overallProgress = calculateProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse">Loading Academic Dossier...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto space-y-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">
              ACADEMIC DOSSIER - SEMESTER 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-mono">
                  {overallProgress.completed} / {overallProgress.total} Topics
                </span>
              </div>
              <Progress value={overallProgress.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="space-y-4">
          {Object.entries(semesterData as SemesterData).map(([courseName, courseData]) => {
            const courseProgress = calculateCourseProgress(courseData.modules);
            
            return (
              <AccordionItem key={courseName} value={courseName} className="border-none">
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex flex-col gap-2 text-left w-full">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-semibold">{courseName}</span>
                        <span className="text-sm text-muted-foreground">
                          {courseData.credits} Credits
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{courseProgress.completed} / {courseProgress.total} Topics</span>
                          <span>{Math.round(courseProgress.percentage)}%</span>
                        </div>
                        <Progress value={courseProgress.percentage} className="h-1.5" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(courseData.modules).map(([moduleName, topics]) => (
                        <AccordionItem
                          key={moduleName}
                          value={moduleName}
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 py-2 text-sm hover:no-underline">
                            {moduleName}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-2">
                            <div className="space-y-2">
                              {topics.map((topic) => {
                                const key = `${moduleName}|||${topic}`;
                                const isChecked = completedTopics.has(key);
                                
                                return (
                                  <div
                                    key={topic}
                                    className="flex items-start gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={() =>
                                        toggleTopic(moduleName, topic, topics)
                                      }
                                      className="mt-0.5"
                                    />
                                    <label className="text-sm cursor-pointer flex-1">
                                      {topic}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
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
