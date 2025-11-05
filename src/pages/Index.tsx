import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TimeEntry } from "@/components/TimeEntry";
import { DailyReflection } from "@/components/DailyReflection";
import { WeeklyStats } from "@/components/WeeklyStats";
import { MonthlyStats } from "@/components/MonthlyStats";
import { GoogleSheetsSync } from "@/components/GoogleSheetsSync";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Target, CalendarDays, TrendingUp, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("로그아웃되었습니다");
      navigate("/auth");
    } catch (error) {
      toast.error("로그아웃에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8 relative">
          <div className="absolute top-0 right-0">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-[var(--shadow-soft)]">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              시간 기록
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">{today}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-accent">
            <Target className="h-4 w-4" />
            <span>매일 15분, 나를 성찰하는 시간</span>
          </div>
        </header>

        {/* Main Content */}
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="today" className="gap-2">
              <Clock className="h-4 w-4" />
              오늘
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              주간 분석
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              월간 분석
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <TimeEntry />
                <DailyReflection />
              </div>
              
              <div className="space-y-6">
                <GoogleSheetsSync />
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                  <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    이번 주 목표
                  </h3>
                  <ul className="space-y-2 text-sm text-foreground/80">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>매일 성찰 시간 15분 확보하기</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>주말에 1시간 주간 피드백 작성하기</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>각 분야별 시간 균형 맞추기</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly">
            <WeeklyStats />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlyStats />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
