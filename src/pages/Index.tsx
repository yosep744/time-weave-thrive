import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TimeEntry } from "@/components/TimeEntry";
import { DailyReflection } from "@/components/DailyReflection";
import { WeeklyStats } from "@/components/WeeklyStats";
import { MonthlyStats } from "@/components/MonthlyStats";
import { CategoryTimeTable } from "@/components/CategoryTimeTable";
import { WeeklyGoals } from "@/components/WeeklyGoals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Clock, Target, CalendarDays, TrendingUp, LogOut, Sparkles } from "lucide-react";
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
    let isMounted = true;
    
    // Check for existing session immediately
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Session error:', error);
          setLoading(false);
          navigate("/auth");
          return;
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (!session) {
          navigate("/auth");
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setLoading(false);
          navigate("/auth");
        }
      }
    };
    
    checkSession();

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      setUser(session?.user ?? null);
      
      if (!session && event === 'SIGNED_OUT') {
        navigate("/auth");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-subtle)' }}>
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 blur-xl opacity-50" style={{ background: 'var(--gradient-primary)' }} />
            <Clock className="h-12 w-12 animate-spin text-primary mx-auto relative" />
          </div>
          <p className="text-muted-foreground font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-subtle)' }}>
      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Premium Header */}
        <div className="animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl">
            <div 
              className="absolute inset-0 opacity-10"
              style={{ background: 'var(--gradient-primary)' }}
            />
            <Card className="relative border-0 shadow-xl">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="w-8 h-8 text-primary" />
                      <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                        시간 사용 명세서
                      </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {today}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <ThemeSwitcher />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleLogout}
                      className="rounded-full hover-scale"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="glass rounded-xl p-4 inline-block">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    매일 15분, 나를 성찰하는 시간
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Premium Tabs */}
        <Tabs defaultValue="today" className="w-full animate-slide-up">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-8 p-1.5 h-auto bg-card/50 backdrop-blur-sm border shadow-md">
            <TabsTrigger 
              value="today" 
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white font-medium px-6 py-2.5"
            >
              <Clock className="h-4 w-4" />
              오늘
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white font-medium px-6 py-2.5"
            >
              <CalendarDays className="h-4 w-4" />
              주간 분석
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white font-medium px-6 py-2.5"
            >
              <TrendingUp className="h-4 w-4" />
              월간 분석
            </TabsTrigger>
          </TabsList>

          {/* Weekly Goals - Always Visible */}
          <div className="mb-6 animate-fade-in">
            <WeeklyGoals />
          </div>

          <TabsContent value="today" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <TimeEntry />
                <CategoryTimeTable />
              </div>
              
              <div>
                <DailyReflection />
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
