import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";
import { getTimeBlock, getCategories } from "@/lib/timeBlockStorage";
import { calculateCategoryTotals } from "@/lib/timeCalculations";

interface CategoryTime {
  label: string;
  hours: number;
  displayText: string;
  color: string;
}

export const CategoryTimeTable = () => {
  const [categoryTimes, setCategoryTimes] = useState<CategoryTime[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blocks, categories] = await Promise.all([
          getTimeBlock(today),
          getCategories()
        ]);

        // Ensure we have categories
        if (categories.length === 0) {
          console.warn('No categories found, data might not display correctly');
        }

        // Use the new calculation utility
        const categoryTotals = calculateCategoryTotals(blocks);

        // Calculate total minutes
        const totalMinutes = Object.values(categoryTotals).reduce(
          (sum, cat) => sum + cat.totalMinutes,
          0
        );
        setTotalHours(totalMinutes / 60);

        // Map to display format with better category matching
        const times: CategoryTime[] = Object.entries(categoryTotals)
          .filter(([_, data]) => data.totalMinutes > 0)
          .map(([categoryValue, data]) => {
            // Find matching category
            const category = categories.find(c => c.value === categoryValue);
            
            return {
              label: category?.label || categoryValue, // Fallback to value if not found
              hours: data.totalMinutes / 60,
              displayText: data.displayText,
              color: category?.color || 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
            };
          })
          .sort((a, b) => b.hours - a.hours);

        setCategoryTimes(times);
      } catch (error) {
        console.error('Error loading category time data:', error);
      }
    };

    loadData();

    // Listen for custom events from same tab
    const handleCustomUpdate = () => {
      loadData();
    };

    window.addEventListener('timeBlocksUpdated', handleCustomUpdate);

    // Poll every 500ms for ultra-fast updates
    const interval = setInterval(loadData, 500);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('timeBlocksUpdated', handleCustomUpdate);
    };
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
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border ${item.color}`}>
                    {item.label}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {item.displayText}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
