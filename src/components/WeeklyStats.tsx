import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";
import { getTimeBlocksForDateRange, getCategoryStats, getCategories } from "@/lib/timeBlockStorage";

const CATEGORY_COLORS: Record<string, string> = {
  work: "hsl(var(--primary))",
  study: "hsl(var(--accent))",
  exercise: "hsl(142, 76%, 36%)",
  meal: "hsl(24, 70%, 50%)",
  rest: "hsl(271, 76%, 53%)",
  other: "hsl(var(--muted))",
};

export const WeeklyStats = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6); // Last 7 days
    
    const blocks = getTimeBlocksForDateRange(startDate, endDate);
    const stats = getCategoryStats(blocks);
    const categories = getCategories();
    
    const data = Object.entries(stats).map(([category, hours]) => {
      const categoryInfo = categories.find((c: any) => c.value === category);
      return {
        category: categoryInfo?.label || category,
        hours: Math.round(hours * 10) / 10,
        color: CATEGORY_COLORS[category] || "hsl(var(--muted))",
      };
    });
    
    setChartData(data);
  }, []);
  
  const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            주간 통계
          </div>
          <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-accent" />
            총 {totalHours}시간
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>아직 기록된 데이터가 없습니다.</p>
            <p className="text-sm mt-1">시간 블록을 추가해보세요!</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="category" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 space-y-3">
              {chartData.map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-foreground">{item.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{item.hours}시간</span>
                <span className="text-xs text-muted-foreground">
                  ({Math.round((item.hours / totalHours) * 100)}%)
                </span>
              </div>
            </div>
          ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
