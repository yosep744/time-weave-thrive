import { TimeEntry } from "@/components/TimeEntry";
import { DailyReflection } from "@/components/DailyReflection";
import { WeeklyStats } from "@/components/WeeklyStats";
import { Clock, Target } from "lucide-react";

const Index = () => {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
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
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <TimeEntry />
            <DailyReflection />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WeeklyStats />
            
            {/* Quick Tips */}
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
      </div>
    </div>
  );
};

export default Index;
