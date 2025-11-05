import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Settings, Palette, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLOR_OPTIONS[0].value);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const { getTimeBlock, getCategories } = await import('@/lib/timeBlockStorage');
      const [blocks, cats] = await Promise.all([
        getTimeBlock(today),
        getCategories()
      ]);
      
      if (blocks.length > 0) {
        setTimeBlocks(blocks);
      }
      
      if (cats.length > 0) {
        setCategories(cats);
      } else {
        const { saveCategories } = await import('@/lib/timeBlockStorage');
        await saveCategories(DEFAULT_CATEGORIES);
      }
      
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [today]);

  useEffect(() => {
    if (isInitialLoad) return;
    
    const saveData = async () => {
      const { saveTimeBlock } = await import('@/lib/timeBlockStorage');
      await saveTimeBlock(today, timeBlocks);
    };
    
    saveData();
  }, [timeBlocks, today, isInitialLoad]);

  useEffect(() => {
    if (isInitialLoad) return;
    
    const saveData = async () => {
      const { saveCategories } = await import('@/lib/timeBlockStorage');
      await saveCategories(categories);
    };
    
    saveData();
  }, [categories, isInitialLoad]);

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
        async () => {
          const { getTimeBlock } = await import('@/lib/timeBlockStorage');
          const blocks = await getTimeBlock(today);
          setTimeBlocks(blocks);
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

  const removeTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter((block) => block.id !== id));
  };

  const updateTimeBlock = (id: string, field: keyof TimeBlock, value: string) => {
    const updatedBlocks = timeBlocks.map((block) => 
      block.id === id ? { ...block, [field]: value } : block
    );
    
    updatedBlocks.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.localeCompare(b.startTime);
    });
    
    setTimeBlocks(updatedBlocks);
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

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.floor((y / rect.height) * (24 * 60));
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    setIsDragging(true);
    setDragStart(roundedMinutes);
    setDragEnd(roundedMinutes);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.floor((y / rect.height) * (24 * 60));
    const roundedMinutes = Math.round(minutes / 15) * 15;
    setDragEnd(roundedMinutes);
  };

  const handleTimelineMouseUp = () => {
    if (!isDragging || dragStart === null || dragEnd === null) {
      setIsDragging(false);
      return;
    }

    const startMin = Math.min(dragStart, dragEnd);
    const endMin = Math.max(dragStart, dragEnd);
    
    if (endMin - startMin < 15) {
      setIsDragging(false);
      return;
    }

    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      startTime: minutesToTime(startMin),
      endTime: minutesToTime(endMin),
      category: "work",
      activity: "",
    };
    
    setTimeBlocks([...timeBlocks, newBlock]);
    setSelectedBlock(newBlock.id);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    toast.success("새 시간 블록이 추가되었습니다");
  };

  const getBlockStyle = (block: TimeBlock) => {
    if (!block.startTime || !block.endTime) return {};
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    const totalMinutes = 24 * 60;
    
    return {
      top: `${(start / totalMinutes) * 100}%`,
      height: `${((end - start) / totalMinutes) * 100}%`,
    };
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
      <CardContent className="space-y-6">
        <div className="relative">
          <div className="flex gap-4">
            <div className="w-16 flex-shrink-0">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground">
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              <div
                ref={timelineRef}
                className="relative border border-border rounded-lg bg-muted/20 cursor-crosshair"
                style={{ height: '1536px' }}
                onMouseDown={handleTimelineMouseDown}
                onMouseMove={handleTimelineMouseMove}
                onMouseUp={handleTimelineMouseUp}
                onMouseLeave={() => {
                  if (isDragging) handleTimelineMouseUp();
                }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-border/30"
                    style={{ top: `${(i / 24) * 100}%` }}
                  />
                ))}

                {isDragging && dragStart !== null && dragEnd !== null && (
                  <div
                    className="absolute left-0 right-0 bg-primary/30 border-2 border-primary rounded"
                    style={{
                      top: `${(Math.min(dragStart, dragEnd) / (24 * 60)) * 100}%`,
                      height: `${(Math.abs(dragEnd - dragStart) / (24 * 60)) * 100}%`,
                    }}
                  />
                )}

                {timeBlocks.map((block) => {
                  const style = getBlockStyle(block);
                  const color = getCategoryColor(block.category);
                  const isSelected = selectedBlock === block.id;
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-0 right-0 mx-1 rounded border-2 cursor-pointer transition-all ${color} ${
                        isSelected ? 'ring-2 ring-primary z-10' : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                      style={style}
                      onClick={() => setSelectedBlock(block.id)}
                    >
                      <div className="p-2 text-xs font-medium">
                        <div className="flex items-center justify-between">
                          <span>{getCategoryLabel(block.category)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTimeBlock(block.id);
                              if (selectedBlock === block.id) setSelectedBlock(null);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-[10px] opacity-80">
                          {block.startTime} - {block.endTime}
                        </div>
                        {block.activity && (
                          <div className="text-[10px] mt-1 opacity-70 line-clamp-2">
                            {block.activity}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            드래그하여 시간 블록을 추가하세요
          </p>
        </div>

        {selectedBlock && timeBlocks.find(b => b.id === selectedBlock) && (
          <div className="p-4 border border-primary/50 rounded-lg bg-card space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">선택한 블록 편집</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBlock(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {(() => {
              const block = timeBlocks.find(b => b.id === selectedBlock)!;
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">시작</label>
                      <Select
                        value={block.startTime}
                        onValueChange={(value) => updateTimeBlock(block.id, "startTime", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {TIME_OPTIONS.map((time) => (
                            <SelectItem key={time} value={time} className="text-xs">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">종료</label>
                      <Select
                        value={block.endTime}
                        onValueChange={(value) => updateTimeBlock(block.id, "endTime", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {TIME_OPTIONS.filter((time) => time > block.startTime).map((time) => (
                            <SelectItem key={time} value={time} className="text-xs">
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">카테고리</label>
                    <Select
                      value={block.category}
                      onValueChange={(value) => updateTimeBlock(block.id, "category", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className={`px-2 py-1 rounded-md text-xs ${cat.color}`}>
                              {cat.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">활동 내용</label>
                    <Textarea
                      value={block.activity}
                      onChange={(e) => updateTimeBlock(block.id, "activity", e.target.value)}
                      placeholder="활동 내용을 입력하세요"
                      className="min-h-[60px] text-xs"
                    />
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
