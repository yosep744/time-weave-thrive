import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Clock } from "lucide-react";
import { getTimeBlock, getCategories } from "@/lib/timeBlockStorage";
import type { TimeBlockExport } from "@/components/TimeEntry";

interface CategoryStat {
  label: string;
  hours: number;
  color: string;
  percentage: number;
}

export const TodayAnalysis = () => {
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadStats = async () => {
      const [blocks, categories] = await Promise.all([
        getTimeBlock(today),
        getCategories()
      ]);

      // Calculate category stats
      const categoryMap = new Map<string, number>();
      
      blocks.forEach((block: TimeBlockExport) => {
        if (!block.startTime || !block.endTime) return;
        
        const [startHour, startMin] = block.startTime.split(':').map(Number);
        const [endHour, endMin] = block.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = (endMinutes - startMinutes) / 60;
        
        const current = categoryMap.get(block.category) || 0;
        categoryMap.set(block.category, current + duration);
      });

      const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      setTotalHours(total);

      const categoryStats: CategoryStat[] = Array.from(categoryMap.entries())
        .map(([value, hours]) => {
          const category = categories.find(c => c.value === value);
          return {
            label: category?.label || value,
            hours: Math.round(hours * 10) / 10,
            color: category?.color || 'bg-muted',
            percentage: total > 0 ? Math.round((hours / total) * 100) : 0,
          };
        })
        .sort((a, b) => b.hours - a.hours);

      setStats(categoryStats);
    };

    loadStats();

    // Refresh every 10 seconds for real-time updates
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, [today]);

  // Convert color classes to hex for charts
  const getColorHex = (colorClass: string): string => {
    const colorMap: Record<string, string> = {
      'bg-primary/20 text-primary border-primary/30': 'hsl(var(--primary))',
      'bg-accent/20 text-accent border-accent/30': 'hsl(var(--accent))',
      'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30': '#22c55e',
      'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30': '#3b82f6',
      'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30': '#f97316',
      'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30': '#a855f7',
      'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30': '#ec4899',
      'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30': '#ef4444',
      'bg-muted/50 text-foreground border-border': 'hsl(var(--muted-foreground))',
    };
    return colorMap[colorClass] || 'hsl(var(--muted))';
  };

  if (stats.length === 0) {
    return (
      <Card className="shadow-[var(--shadow-card)] border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            오늘의 시간 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            시간 블록을 추가하면 실시간 분석이 표시됩니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            오늘의 시간 분석
          </span>
          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" />
            총 {totalHours.toFixed(1)}시간
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <XAxis 
                dataKey="label" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-md ${stat.color}`}>
                  {stat.label}
                </span>
                <span className="text-muted-foreground">
                  {stat.hours}시간 ({stat.percentage}%)
                </span>
              </div>
              <Progress value={stat.percentage} className="h-2" />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            실시간으로 업데이트되는 시간 사용 분석입니다
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
