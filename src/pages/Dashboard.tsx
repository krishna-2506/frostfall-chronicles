import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Code2, Terminal, GraduationCap, Trophy, Timer } from "lucide-react";
import { DailyStreak } from "@/components/DailyStreak";
import dsaData from "@/data/dsa_playlist.json";
import mlData from "@/data/course_tracker.json";
import semesterData from "@/data/firstsem.json";

type CourseData = { [section: string]: { name: string }[] };
type SemesterData = { [course: string]: { credits: number; modules: { [m: string]: string[] } } };

export default function Dashboard() {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [progressRes, statsRes] = await Promise.all([
        supabase.from("course_progress").select("section_name, video_name").eq("user_id", user.id).eq("completed", true),
        supabase.from("user_stats").select("total_xp").eq("user_id", user.id).maybeSingle(),
      ]);

      if (progressRes.data) {
        setCompletedItems(new Set(progressRes.data.map((i) => `${i.section_name}|||${i.video_name}`)));
      }
      setTotalXp(statsRes.data?.total_xp || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const countTotal = (data: CourseData) => Object.values(data).flat().length;
  const countCompleted = (data: CourseData) => 
    Object.entries(data).flatMap(([s, items]) => items.filter((i) => completedItems.has(`${s}|||${i.name}`))).length;

  const countSemesterTotal = () => {
    let t = 0;
    Object.values(semesterData as SemesterData).forEach((c) => {
      Object.values(c.modules).forEach((topics) => (t += topics.length));
    });
    return t;
  };

  const countSemesterCompleted = () => {
    let c = 0;
    Object.values(semesterData as SemesterData).forEach((course) => {
      Object.entries(course.modules).forEach(([m, topics]) => {
        topics.forEach((t) => {
          if (completedItems.has(`${m}|||${t}`)) c++;
        });
      });
    });
    return c;
  };

  const dsaTotal = countTotal(dsaData as CourseData);
  const dsaCompleted = countCompleted(dsaData as CourseData);
  const mlTotal = countTotal(mlData as CourseData);
  const mlCompleted = countCompleted(mlData as CourseData);
  const semTotal = countSemesterTotal();
  const semCompleted = countSemesterCompleted();

  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;

  const courses = [
    { name: "DSA", icon: Code2, completed: dsaCompleted, total: dsaTotal, href: "/dsa", color: "text-primary" },
    { name: "ML Course", icon: Terminal, completed: mlCompleted, total: mlTotal, href: "/ml-course", color: "text-accent" },
    { name: "Semester", icon: GraduationCap, completed: semCompleted, total: semTotal, href: "/semester", color: "text-muted-foreground" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your learning progress</p>
        </div>
        <div className="flex items-center gap-3">
          <DailyStreak />
          <Link to="/focus">
            <Button variant="outline" size="sm" className="gap-2">
              <Timer className="h-4 w-4" />
              Focus
            </Button>
          </Link>
        </div>
      </div>

      {/* XP Card */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{totalXp.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">XP</span>
              </div>
              <p className="text-sm text-muted-foreground">Level {level}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Progress</h2>
        <div className="grid gap-4">
          {courses.map((course) => {
            const pct = course.total > 0 ? (course.completed / course.total) * 100 : 0;
            return (
              <Link key={course.name} to={course.href}>
                <Card className="border-border/50 hover:border-border transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <course.icon className={`h-5 w-5 ${course.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{course.name}</span>
                          <span className="text-sm text-muted-foreground tabular-nums">
                            {course.completed}/{course.total}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}