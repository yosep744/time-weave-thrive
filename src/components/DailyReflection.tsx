import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

export const DailyReflection = () => {
  const [reflection, setReflection] = useState("");

  const handleSave = () => {
    if (reflection.trim()) {
      toast.success("오늘의 성찰이 저장되었습니다");
      // TODO: Save to database
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)] border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-primary" />
          오늘의 성찰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="오늘 하루를 돌아보며...&#10;&#10;• 가장 집중했던 순간은?&#10;• 개선할 점은?&#10;• 내일의 계획은?"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="min-h-[200px] text-base leading-relaxed"
        />
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>매일 15분의 성찰 시간</span>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)]"
          >
            <Save className="h-4 w-4 mr-2" />
            저장
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
