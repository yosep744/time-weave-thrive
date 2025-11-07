import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Settings, Palette, GripVertical, Check, X } from "lucide-react";
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
  { value: "work", label: "업무", color: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700" },
  { value: "study", label: "공부", color: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700" },
  { value: "exercise", label: "운동", color: "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700" },
  { value: "meal", label: "식사", color: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700" },
  { value: "rest", label: "휴식", color: "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700" },
  { value: "other", label: "기타", color: "bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600" },
];

const COLOR_OPTIONS = [
  { value: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700", label: "Blue" },
  { value: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700", label: "Purple" },
  { value: "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-100 dark:border-green-700", label: "Green" },
  { value: "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700", label: "Orange" },
  { value: "bg-pink-100 text-pink-900 border-pink-300 dark:bg-pink-900/40 dark:text-pink-100 dark:border-pink-700", label: "Pink" },
  { value: "bg-red-100 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-100 dark:border-red-700", label: "Red" },
  { value: "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-900/40 dark:text-teal-100 dark:border-teal-700", label: "Teal" },
  { value: "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-100 dark:border-yellow-700", label: "Yellow" },
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
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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
      try {
        const { saveTimeBlock } = await import('@/lib/timeBlockStorage');
        await saveTimeBlock(today, timeBlocks);
      } catch (error) {
        console.error('Failed to save time blocks:', error);
        toast.error('시간 블록 저장에 실패했습니다');
      }
    };
    
    const timeoutId = setTimeout(saveData, 300);
    return () => clearTimeout(timeoutId);
  }, [timeBlocks, today, isInitialLoad]);

  useEffect(() => {
    if (isInitialLoad) return;
    
    const saveData = async () => {
      const { saveCategories } = await import('@/lib/timeBlockStorage');
      await saveCategories(categories);
    };
    
    saveData();
  }, [categories, isInitialLoad]);

  // Real-time sync disabled to prevent conflicts with local edits
  // Data will be reloaded when user refreshes or navigates away and back

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

  const updateEditingBlock = (field: keyof TimeBlock, value: string) => {
    if (editingBlock) {
      setEditingBlock({ ...editingBlock, [field]: value });
    }
  };

  const handleSaveEditingBlock = () => {
    if (editingBlock) {
      updateTimeBlock(editingBlock.id, 'startTime', editingBlock.startTime);
      updateTimeBlock(editingBlock.id, 'endTime', editingBlock.endTime);
      updateTimeBlock(editingBlock.id, 'category', editingBlock.category);
      updateTimeBlock(editingBlock.id, 'activity', editingBlock.activity);
      setIsEditDialogOpen(false);
      setEditingBlock(null);
      toast.success("시간 블록이 저장되었습니다");
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingBlock(null);
  };

  const handleOpenEditDialog = (block: TimeBlock) => {
    setEditingBlock({ ...block });
    setIsEditDialogOpen(true);
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

  const handleTimeSlotClick = (hour: number) => {
    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String(hour + 1).padStart(2, '0')}:00`,
      category: categories[0]?.value || "work",
      activity: "",
    };

    setTimeBlocks([...timeBlocks, newBlock]);
    // Open edit dialog immediately
    setEditingBlock(newBlock);
    setIsEditDialogOpen(true);
  };

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disabled drag creation - using click instead
    return;
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent interfering with Select dropdown interactions
    if (isSelectOpen) return;
    
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
  };

  const handleTimelineMouseUp = () => {
    if (resizingBlock) {
      setResizingBlock(null);
      setResizeMode(null);
      setResizeStartY(0);
      setResizeStartTime(null);
      return;
    }
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
          <div className="flex gap-2 md:gap-4">
            <div className="w-12 md:w-16 flex-shrink-0">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-20 flex items-start justify-end pr-1 md:pr-2 text-[10px] md:text-xs text-muted-foreground font-medium">
                  {i.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="flex-1 relative min-w-0">
              <div
                ref={timelineRef}
                className="relative border border-border rounded-lg bg-card"
                style={{ height: '1920px' }}
                onMouseMove={handleTimelineMouseMove}
                onMouseUp={handleTimelineMouseUp}
                onMouseLeave={() => {
                  if (resizingBlock) handleTimelineMouseUp();
                }}
              >
                {Array.from({ length: 24 }, (_, hour) => {
                  const blockInSlot = timeBlocks.find(
                    (b) =>
                      parseInt(b.startTime.split(":")[0]) <= hour &&
                      parseInt(b.endTime.split(":")[0]) > hour
                  );

                  return (
                    <div
                      key={hour}
                      className={`absolute w-full border-t border-border/30 h-20 ${!blockInSlot ? 'hover:bg-primary/5 cursor-pointer' : ''}`}
                      style={{ top: `${(hour / 24) * 100}%` }}
                      onClick={() => !blockInSlot && handleTimeSlotClick(hour)}
                      onTouchEnd={(e) => {
                        if (!blockInSlot) {
                          e.preventDefault();
                          handleTimeSlotClick(hour);
                        }
                      }}
                    >
                      {!blockInSlot && (
                        <div className="opacity-0 hover:opacity-100 transition-opacity text-xs text-muted-foreground p-2">
                          클릭하여 추가
                        </div>
                      )}
                    </div>
                  );
                })}


                {timeBlocks.map((block) => {
                  const style = getBlockStyle(block);
                  const color = getCategoryColor(block.category);
                  const isResizing = resizingBlock === block.id;
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute left-0 right-0 mx-1 rounded border-2 cursor-pointer transition-all ${color} hover:ring-2 hover:ring-primary/50 z-10 ${isResizing ? 'ring-2 ring-primary z-20 shadow-lg' : ''}`}
                      style={style}
                      onClick={() => handleOpenEditDialog(block)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleOpenEditDialog(block);
                      }}
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
                        <div className="px-2 md:px-2.5 py-1.5 md:py-2 h-full flex flex-col gap-0.5 md:gap-1">
                          <div className="flex items-center gap-1 md:gap-1.5 min-w-0 overflow-hidden">
                            <span className="font-semibold text-xs md:text-sm flex-shrink-0">{getCategoryLabel(block.category)}</span>
                            {block.activity && (
                              <>
                                <span className="text-[10px] md:text-xs opacity-50 flex-shrink-0">•</span>
                                <span className="text-[10px] md:text-xs opacity-90 truncate flex-1 min-w-0">{block.activity}</span>
                              </>
                            )}
                            <GripVertical className="h-3 md:h-3.5 w-3 md:w-3.5 opacity-30 flex-shrink-0 ml-auto" />
                          </div>
                          <div className="text-[10px] md:text-xs opacity-75 font-medium">
                            {block.startTime} - {block.endTime}
                          </div>
                        </div>
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
        </div>

        {/* Edit Block Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-primary" />
                시간 블록 편집
              </DialogTitle>
            </DialogHeader>
            {editingBlock && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">시작 시간</label>
                    <Select
                      value={editingBlock.startTime}
                      onValueChange={(value) => updateEditingBlock("startTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">종료 시간</label>
                    <Select
                      value={editingBlock.endTime}
                      onValueChange={(value) => updateEditingBlock("endTime", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">카테고리</label>
                  <Select
                    value={editingBlock.category}
                    onValueChange={(value) => {
                      updateEditingBlock("category", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getCategoryColor(editingBlock.category)}`}>
                          {getCategoryLabel(editingBlock.category)}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${cat.color}`}>
                            {cat.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">활동 내용</label>
                  <Input
                    placeholder="무엇을 했나요?"
                    value={editingBlock.activity}
                    onChange={(e) => updateEditingBlock("activity", e.target.value)}
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      removeTimeBlock(editingBlock.id);
                      setIsEditDialogOpen(false);
                      setEditingBlock(null);
                      toast.success("시간 블록이 삭제되었습니다");
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      취소
                    </Button>
                    <Button
                      onClick={handleSaveEditingBlock}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      저장
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
