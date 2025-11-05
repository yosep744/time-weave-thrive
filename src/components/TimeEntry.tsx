import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Settings, Palette, GripVertical } from "lucide-react";
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
  { value: "work", label: "업무", color: "bg-primary/20 text-primary border-primary/30" },
  { value: "study", label: "공부", color: "bg-accent/20 text-accent border-accent/30" },
  { value: "exercise", label: "운동", color: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" },
  { value: "meal", label: "식사", color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { value: "rest", label: "휴식", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { value: "other", label: "기타", color: "bg-muted/50 text-foreground border-border" },
];

const COLOR_OPTIONS = [
  { value: "bg-primary/20 text-primary border-primary/30", label: "Primary" },
  { value: "bg-accent/20 text-accent border-accent/30", label: "Accent" },
  { value: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30", label: "Green" },
  { value: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30", label: "Blue" },
  { value: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30", label: "Orange" },
  { value: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30", label: "Purple" },
  { value: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30", label: "Pink" },
  { value: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30", label: "Red" },
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

type ResizeMode = 'top' | 'bottom' | 'move' | null;

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
  
  const [resizingBlock, setResizingBlock] = useState<string | null>(null);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeStartTime, setResizeStartTime] = useState<{ start: string; end: string } | null>(null);
  
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
    const clamped = Math.max(0, Math.min(24 * 60 - 1, minutes));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || resizingBlock) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.floor((y / rect.height) * (24 * 60));
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    setIsDragging(true);
    setDragStart(roundedMinutes);
    setDragEnd(roundedMinutes);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (resizingBlock && resizeMode && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const deltaY = y - resizeStartY;
      const deltaMinutes = Math.round((deltaY / rect.height) * (24 * 60) / 15) * 15;
      
      if (resizeStartTime) {
        const block = timeBlocks.find(b => b.id === resizingBlock);
        if (!block) return;
        
        const startMin = timeToMinutes(resizeStartTime.start);
        const endMin = timeToMinutes(resizeStartTime.end);
        
        if (resizeMode === 'top') {
          const newStart = startMin + deltaMinutes;
          if (newStart >= 0 && newStart < endMin - 15) {
            updateTimeBlock(resizingBlock, 'startTime', minutesToTime(newStart));
          }
        } else if (resizeMode === 'bottom') {
          const newEnd = endMin + deltaMinutes;
          if (newEnd > startMin + 15 && newEnd <= 24 * 60) {
            updateTimeBlock(resizingBlock, 'endTime', minutesToTime(newEnd));
          }
        } else if (resizeMode === 'move') {
          const duration = endMin - startMin;
          const newStart = startMin + deltaMinutes;
          const newEnd = newStart + duration;
          if (newStart >= 0 && newEnd <= 24 * 60) {
            updateTimeBlock(resizingBlock, 'startTime', minutesToTime(newStart));
            updateTimeBlock(resizingBlock, 'endTime', minutesToTime(newEnd));
          }
        }
      }
      return;
    }
    
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.floor((y / rect.height) * (24 * 60));
    const roundedMinutes = Math.round(minutes / 15) * 15;
    setDragEnd(roundedMinutes);
  };

  const handleTimelineMouseUp = () => {
    if (resizingBlock) {
      setResizingBlock(null);
      setResizeMode(null);
      setResizeStartY(0);
      setResizeStartTime(null);
      return;
    }
    
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

  const handleBlockResizeStart = (e: React.MouseEvent, blockId: string, mode: ResizeMode) => {
    e.stopPropagation();
    if (!timelineRef.current) return;
    
    const block = timeBlocks.find(b => b.id === blockId);
    if (!block) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    setResizingBlock(blockId);
    setResizeMode(mode);
    setResizeStartY(e.clientY - rect.top);
    setResizeStartTime({ start: block.startTime, end: block.endTime });
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
                <div key={i} className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground font-medium">
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              <div
                ref={timelineRef}
                className="relative border border-border rounded-lg bg-card cursor-crosshair"
                style={{ height: '1536px' }}
                onMouseDown={handleTimelineMouseDown}
                onMouseMove={handleTimelineMouseMove}
                onMouseUp={handleTimelineMouseUp}
                onMouseLeave={() => {
                  if (isDragging) handleTimelineMouseUp();
                  if (resizingBlock) handleTimelineMouseUp();
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
                    className="absolute left-0 right-0 bg-primary/30 border-2 border-primary rounded pointer-events-none"
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
                  const isResizing = resizingBlock === block.id;
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-0 right-0 mx-1 rounded border-2 cursor-pointer transition-all ${color} ${
                        isSelected || isResizing ? 'ring-2 ring-primary z-20 shadow-lg' : 'hover:ring-2 hover:ring-primary/50 z-10'
                      }`}
                      style={style}
                      onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                    >
                      {/* Top resize handle */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 flex items-center justify-center group"
                        onMouseDown={(e) => handleBlockResizeStart(e, block.id, 'top')}
                      >
                        <div className="w-8 h-0.5 bg-foreground/20 rounded group-hover:bg-primary"></div>
                      </div>
                      
                      {/* Move handle and content */}
                      <div 
                        className="absolute top-2 left-0 right-0 bottom-2 cursor-move"
                        onMouseDown={(e) => handleBlockResizeStart(e, block.id, 'move')}
                      >
                        {isSelected ? (
                          <div className="p-2 space-y-2 h-full overflow-auto">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <GripVertical className="h-3 w-3 opacity-50" />
                                <span className="text-xs font-semibold">편집 중</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 hover:bg-destructive/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTimeBlock(block.id);
                                  setSelectedBlock(null);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1">
                              <Select
                                value={block.startTime}
                                onValueChange={(value) => updateTimeBlock(block.id, "startTime", value)}
                              >
                                <SelectTrigger className="h-7 text-[10px]" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-48">
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time} value={time} className="text-xs">
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Select
                                value={block.endTime}
                                onValueChange={(value) => updateTimeBlock(block.id, "endTime", value)}
                              >
                                <SelectTrigger className="h-7 text-[10px]" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-48">
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time} value={time} className="text-xs">
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Select
                              value={block.category}
                              onValueChange={(value) => updateTimeBlock(block.id, "category", value)}
                            >
                              <SelectTrigger className="h-7 text-[10px]" onClick={(e) => e.stopPropagation()}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat.value} value={cat.value}>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] ${cat.color}`}>
                                      {cat.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Textarea
                              placeholder="활동 내용"
                              value={block.activity}
                              onChange={(e) => updateTimeBlock(block.id, "activity", e.target.value)}
                              className="min-h-12 text-[10px] p-1.5 bg-card/50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <div className="p-2 text-xs font-medium h-full flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold">{getCategoryLabel(block.category)}</span>
                              <GripVertical className="h-3 w-3 opacity-30" />
                            </div>
                            <div className="text-[10px] opacity-80 font-medium">
                              {block.startTime} - {block.endTime}
                            </div>
                            {block.activity && (
                              <div className="text-[10px] mt-1 opacity-70 line-clamp-2 flex-1">
                                {block.activity}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Bottom resize handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-primary/20 flex items-center justify-center group"
                        onMouseDown={(e) => handleBlockResizeStart(e, block.id, 'bottom')}
                      >
                        <div className="w-8 h-0.5 bg-foreground/20 rounded group-hover:bg-primary"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 드래그하여 블록 추가 • 위/아래 드래그로 크기 조정 • 블록 드래그로 이동 • 클릭하여 편집
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
