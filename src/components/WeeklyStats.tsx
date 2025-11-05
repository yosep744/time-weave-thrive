import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";

const SAMPLE_DATA = [
  { category: "업무", hours: 25, color: "hsl(var(--primary))" },
  { category: "공부", hours: 15, color: "hsl(var(--accent))" },
  { category: "운동", hours: 5, color: "hsl(142, 76%, 36%)" },
  { category: "식사", hours: 7, color: "hsl(24, 70%, 50%)" },
  { category: "휴식", hours: 8, color: "hsl(271, 76%, 53%)" },
];

export const WeeklyStats = () => {
  const totalHours = SAMPLE_DATA.reduce((sum, item) => sum + item.hours, 0);

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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={SAMPLE_DATA}>
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
              {SAMPLE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 space-y-3">
          {SAMPLE_DATA.map((item) => (
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
      </CardContent>
    </Card>
  );
};
