import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  category: string;
  activity: string;
}

const CATEGORIES = [
  { value: "work", label: "업무", color: "bg-primary/10 text-primary" },
  { value: "study", label: "공부", color: "bg-accent/10 text-accent" },
  { value: "exercise", label: "운동", color: "bg-green-500/10 text-green-700 dark:text-green-400" },
  { value: "meal", label: "식사", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
  { value: "rest", label: "휴식", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400" },
  { value: "other", label: "기타", color: "bg-muted text-muted-foreground" },
];

export const TimeEntry = () => {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { id: "1", startTime: "09:00", endTime: "12:00", category: "work", activity: "" },
  ]);

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
    setTimeBlocks(
      timeBlocks.map((block) => (block.id === id ? { ...block, [field]: value } : block))
    );
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          오늘의 시간 기록
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
                <Input
                  id={`start-${block.id}`}
                  type="time"
                  value={block.startTime}
                  onChange={(e) => updateTimeBlock(block.id, "startTime", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`end-${block.id}`} className="text-sm text-foreground/80">
                  종료 시간
                </Label>
                <Input
                  id={`end-${block.id}`}
                  type="time"
                  value={block.endTime}
                  onChange={(e) => updateTimeBlock(block.id, "endTime", e.target.value)}
                  className="mt-1"
                />
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
                  {CATEGORIES.map((cat) => (
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
      </CardContent>
    </Card>
  );
};
