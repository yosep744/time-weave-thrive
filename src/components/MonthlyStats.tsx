import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { Calendar, TrendingUp } from "lucide-react";

const monthlyData = [
  { week: "1주차", 업무: 25, 학습: 18, 운동: 5, 기타: 8 },
  { week: "2주차", 업무: 28, 학습: 15, 운동: 6, 기타: 7 },
  { week: "3주차", 업무: 30, 학습: 20, 운동: 4, 기타: 6 },
  { week: "4주차", 업무: 27, 학습: 22, 운동: 7, 기타: 5 },
];

const categoryTotal = [
  { name: "업무", value: 110, color: "hsl(var(--primary))" },
  { name: "학습", value: 75, color: "hsl(var(--accent))" },
  { name: "운동", value: 22, color: "hsl(var(--chart-2))" },
  { name: "기타", value: 26, color: "hsl(var(--muted))" },
];

export const MonthlyStats = () => {
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
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
              <Bar dataKey="업무" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="학습" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="운동" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="기타" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
        </CardContent>
      </Card>
    </div>
  );
};
