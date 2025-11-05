import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Clock, Settings, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  category: string;
  activity: string;
}

interface Category {
  value: string;
  label: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { value: "work", label: "업무", color: "bg-primary/10 text-primary" },
  { value: "study", label: "공부", color: "bg-accent/10 text-accent" },
  { value: "exercise", label: "운동", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "meal", label: "식사", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { value: "rest", label: "휴식", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { value: "other", label: "기타", color: "bg-muted text-muted-foreground" },
];

const COLOR_OPTIONS = [
  { value: "bg-primary/10 text-primary", label: "Primary" },
  { value: "bg-accent/10 text-accent", label: "Accent" },
  { value: "bg-green-500/10 text-green-700 dark:text-green-400", label: "Green" },
  { value: "bg-blue-500/10 text-blue-700 dark:text-blue-400", label: "Blue" },
  { value: "bg-orange-500/10 text-orange-700 dark:text-orange-400", label: "Orange" },
  { value: "bg-purple-500/10 text-purple-700 dark:text-purple-400", label: "Purple" },
  { value: "bg-pink-500/10 text-pink-700 dark:text-pink-400", label: "Pink" },
  { value: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Red" },
];

// 15분 단위 시간 옵션 생성
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export interface TimeBlockExport extends TimeBlock {
  date: string;
}

export const TimeEntry = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0].value);

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { getTimeBlock, getCategories } = await import('@/lib/timeBlockStorage');
      const [blocks, cats] = await Promise.all([
        getTimeBlock(today),
        getCategories()
      ]);
      
      if (blocks.length > 0) {
        setTimeBlocks(blocks);
      } else {
        // Only set default block if no data exists
        setTimeBlocks([
          { id: "1", startTime: "09:00", endTime: "12:00", category: "work", activity: "" }
        ]);
      }
      
      if (cats.length > 0) {
        setCategories(cats);
      } else {
        // Initialize with default categories if none exist
        const { saveCategories } = await import('@/lib/timeBlockStorage');
        await saveCategories(DEFAULT_CATEGORIES);
      }
      
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [today]);

  // Save timeBlocks to Supabase (skip initial load)
  useEffect(() => {
    if (isInitialLoad) return;
    
    const saveData = async () => {
      const { saveTimeBlock } = await import('@/lib/timeBlockStorage');
      await saveTimeBlock(today, timeBlocks);
    };
    
    saveData();
  }, [timeBlocks, today, isInitialLoad]);

  // Save categories to Supabase (skip initial load)
  useEffect(() => {
    if (isInitialLoad) return;
    
    const saveData = async () => {
      const { saveCategories } = await import('@/lib/timeBlockStorage');
      await saveCategories(categories);
    };
    
    saveData();
  }, [categories, isInitialLoad]);

  // Real-time sync from Supabase
  useEffect(() => {
    if (isInitialLoad) return;
    
    const channel = supabase
      .channel('time_blocks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_blocks',
          filter: `date=eq.${today}`
        },
        async (payload) => {
          // Only update if change was from another client
          console.log('Realtime update received:', payload);
          const { getTimeBlock } = await import('@/lib/timeBlockStorage');
          const blocks = await getTimeBlock(today);
          setTimeBlocks(blocks.length > 0 ? blocks : [
            { id: "1", startTime: "09:00", endTime: "12:00", category: "work", activity: "" }
          ]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        async () => {
          console.log('Categories updated');
          const { getCategories } = await import('@/lib/timeBlockStorage');
          const cats = await getCategories();
          if (cats.length > 0) {
            setCategories(cats);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [today, isInitialLoad]);

  const addTimeBlock = () => {
    const lastBlock = timeBlocks[timeBlocks.length - 1];
    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      startTime: lastBlock?.endTime || "09:00",
      endTime: "",
      category: "work",
      activity: "",
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const removeTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== id));
  };

  const updateTimeBlock = (id: string, field: keyof TimeBlock, value: string) => {
    const updatedBlocks = timeBlocks.map((block) => 
      block.id === id ? { ...block, [field]: value } : block
    );
    
    // Sort by start time
    updatedBlocks.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.localeCompare(b.startTime);
    });
    
    setTimeBlocks(updatedBlocks);
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "-";
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    if (duration < 0) return "-";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
  };

  const getCategoryLabel = (value: string) => {
    return categories.find((cat) => cat.value === value)?.label || value;
  };

  const getCategoryColor = (value: string) => {
    return categories.find((cat) => cat.value === value)?.color || "";
  };

  const addCategory = () => {
    if (!newCategoryLabel.trim()) return;
    const newCategory: Category = {
      value: newCategoryLabel.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryLabel,
      color: newCategoryColor,
    };
    setCategories([...categories, newCategory]);
    setNewCategoryLabel("");
    setNewCategoryColor(COLOR_OPTIONS[0].value);
  };

  const updateCategory = (oldValue: string, newLabel: string, newColor: string) => {
    setCategories(categories.map(cat => 
      cat.value === oldValue 
        ? { ...cat, label: newLabel, color: newColor }
        : cat
    ));
  };

  const deleteCategory = (value: string) => {
    setCategories(categories.filter(cat => cat.value !== value));
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground">
          <span>오늘의 시간 기록</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                카테고리 관리
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>카테고리 관리</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">기존 카테고리</h4>
                  {categories.map((cat) => (
                    <div key={cat.value} className="flex items-center gap-2 p-3 border border-border rounded-lg">
                      <span className={`px-3 py-1 rounded-md text-sm font-medium ${cat.color} flex-1`}>
                        {cat.label}
                      </span>
                      <Select
                        value={cat.color}
                        onValueChange={(color) => updateCategory(cat.value, cat.label, color)}
                      >
                        <SelectTrigger className="w-32">
                          <Palette className="h-4 w-4" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={`px-2 py-1 rounded-md text-xs ${option.value}`}>
                                {option.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(cat.value)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-3">새 카테고리 추가</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="카테고리 이름"
                      value={newCategoryLabel}
                      onChange={(e) => setNewCategoryLabel(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                      <SelectTrigger className="w-32">
                        <Palette className="h-4 w-4" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={`px-2 py-1 rounded-md text-xs ${option.value}`}>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={addCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeBlocks.map((block, index) => (
          <div
            key={block.id}
            className="p-4 border border-border rounded-lg bg-card/50 space-y-3 transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                시간 블록 {index + 1}
              </span>
              {timeBlocks.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTimeBlock(block.id)}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`start-${block.id}`} className="text-sm text-foreground/80">
                  시작 시간
                </Label>
                <Select
                  value={block.startTime}
                  onValueChange={(value) => updateTimeBlock(block.id, "startTime", value)}
                >
                  <SelectTrigger id={`start-${block.id}`} className="mt-1">
                    <SelectValue placeholder="시작 시간 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_OPTIONS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor={`end-${block.id}`} className="text-sm text-foreground/80">
                  종료 시간
                </Label>
                <Select
                  value={block.endTime}
                  onValueChange={(value) => updateTimeBlock(block.id, "endTime", value)}
                >
                  <SelectTrigger id={`end-${block.id}`} className="mt-1">
                    <SelectValue placeholder="종료 시간 선택" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_OPTIONS.filter((time) => {
                      if (!block.startTime) return true;
                      return time > block.startTime;
                    }).map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor={`category-${block.id}`} className="text-sm text-foreground/80">
                카테고리
              </Label>
              <Select
                value={block.category}
                onValueChange={(value) => updateTimeBlock(block.id, "category", value)}
              >
                <SelectTrigger id={`category-${block.id}`} className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <span className={`px-2 py-1 rounded-md ${cat.color}`}>
                        {cat.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor={`activity-${block.id}`} className="text-sm text-foreground/80">
                활동 내용
              </Label>
              <Textarea
                id={`activity-${block.id}`}
                placeholder="예: AI에 대한 심도깊은 공부"
                value={block.activity}
                onChange={(e) => updateTimeBlock(block.id, "activity", e.target.value)}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        ))}

        <Button
          onClick={addTimeBlock}
          variant="outline"
          className="w-full border-dashed border-2 hover:bg-primary/5 hover:border-primary transition-[var(--transition-smooth)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          시간 블록 추가
        </Button>

        {timeBlocks.length > 0 && timeBlocks.some(block => block.startTime && block.endTime) && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">오늘의 시간 사용 내역</h3>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>시간</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>활동</TableHead>
                    <TableHead className="text-right">소요시간</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeBlocks
                    .filter(block => block.startTime && block.endTime)
                    .map((block) => (
                      <TableRow key={block.id}>
                        <TableCell className="font-medium">
                          {block.startTime} - {block.endTime}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(block.category)}`}>
                            {getCategoryLabel(block.category)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {block.activity || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {calculateDuration(block.startTime, block.endTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
