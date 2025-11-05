import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { getTimeBlock, getCategories } from "@/lib/timeBlockStorage";

interface CategoryTime {
  label: string;
  hours: number;
  color: string;
}

export const CategoryTimeTable = () => {
  const [categoryTimes, setCategoryTimes] = useState<CategoryTime[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      const [blocks, categories] = await Promise.all([
        getTimeBlock(today),
        getCategories()
      ]);

      const categoryMap = new Map<string, number>();
      
      blocks.forEach((block) => {
        if (!block.startTime || !block.endTime) return;
        
        const [startHour, startMin] = block.startTime.split(':').map(Number);
        const [endHour, endMin] = block.endTime.split(':').map(Number);
        
        // Validate parsed values
        if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
          console.warn('Invalid time format:', block.startTime, block.endTime);
          return;
        }
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        // Calculate duration (handle overnight blocks)
        let durationMinutes = endMinutes - startMinutes;
        if (durationMinutes < 0) {
          durationMinutes += 24 * 60; // Add 24 hours for overnight blocks
        }
        
        // Validate duration (must be positive and less than 24 hours)
        if (durationMinutes <= 0 || durationMinutes > 24 * 60) {
          console.warn('Invalid duration:', durationMinutes, 'minutes for block:', block);
          return;
        }
        
        const durationHours = durationMinutes / 60;
        
        const current = categoryMap.get(block.category) || 0;
        categoryMap.set(block.category, current + durationHours);
      });

      const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);
      setTotalHours(total);

      const times: CategoryTime[] = Array.from(categoryMap.entries())
        .map(([value, hours]) => {
          const category = categories.find(c => c.value === value);
          return {
            label: category?.label || value,
            hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
            color: category?.color || 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
          };
        })
        .filter(item => item.hours > 0) // Only show categories with positive hours
        .sort((a, b) => b.hours - a.hours);

      setCategoryTimes(times);
    };

    loadData();

    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [today]);

  if (categoryTimes.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            카테고리별 시간사용
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            총 {totalHours.toFixed(1)}시간
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">시간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryTimes.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${item.color}`}>
                    {item.label}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.hours}시간
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
