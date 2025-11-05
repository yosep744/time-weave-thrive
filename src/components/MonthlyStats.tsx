import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
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

export const MonthlyStats = () => {
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categoryTotal, setCategoryTotal] = useState<any[]>([]);
  
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 27); // Last 4 weeks
    
    const categories = getCategories();
    
    // Calculate weekly data
    const weeks: any[] = [];
    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(endDate);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      
      const blocks = getTimeBlocksForDateRange(weekStart, weekEnd);
      const stats = getCategoryStats(blocks);
      
      const weekData: any = { week: `${4 - i}주차` };
      Object.entries(stats).forEach(([category, hours]) => {
        const categoryInfo = categories.find((c: any) => c.value === category);
        weekData[categoryInfo?.label || category] = Math.round(hours * 10) / 10;
      });
      
      weeks.unshift(weekData);
    }
    setWeeklyData(weeks);
    
    // Calculate category totals
    const allBlocks = getTimeBlocksForDateRange(startDate, endDate);
    const totalStats = getCategoryStats(allBlocks);
    
    const totals = Object.entries(totalStats).map(([category, hours]) => {
      const categoryInfo = categories.find((c: any) => c.value === category);
      return {
        name: categoryInfo?.label || category,
        value: Math.round(hours * 10) / 10,
        color: CATEGORY_COLORS[category] || "hsl(var(--muted))",
      };
    });
    setCategoryTotal(totals);
  }, []);
  
  const totalHours = categoryTotal.reduce((sum, cat) => sum + cat.value, 0);

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>월간 시간 분석</CardTitle>
          </div>
          <CardDescription>이번 달 주차별 시간 사용 현황</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyData.length === 0 || weeklyData.every(w => Object.keys(w).length === 1) ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>아직 기록된 데이터가 없습니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                {Object.keys(weeklyData[0] || {})
                  .filter(key => key !== 'week')
                  .map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      fill={Object.values(CATEGORY_COLORS)[index] || "hsl(var(--muted))"} 
                      radius={[4, 4, 0, 0]} 
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            <CardTitle>카테고리별 총 시간</CardTitle>
          </div>
          <CardDescription>총 {totalHours}시간 기록됨</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryTotal.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>아직 기록된 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryTotal}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryTotal.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-4">
                {categoryTotal.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      {category.value}시간 ({((category.value / totalHours) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(category.value / totalHours) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
