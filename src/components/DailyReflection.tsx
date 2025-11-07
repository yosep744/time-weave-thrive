import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getTimeBlock } from "@/lib/timeBlockStorage";

export const DailyReflection = () => {
  const today = new Date().toISOString().split('T')[0];
  const [reflection, setReflection] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");

  // Load reflection from Supabase
  useEffect(() => {
    const loadReflection = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reflections')
        .select('content')
        .eq('date', today)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setReflection(data.content);
      }
    };

    loadReflection();
  }, [today]);

  // Real-time sync disabled to prevent conflicts with local edits

  const handleSave = async () => {
    if (!reflection.trim()) {
      toast.error("성찰 내용을 입력해주세요");
      return;
    }
    
    setIsSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User auth error:', userError);
        toast.error("로그인이 필요합니다");
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('reflections')
        .upsert({
          date: today,
          content: reflection,
          user_id: user.id,
        }, {
          onConflict: 'date,user_id'
        });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      
      toast.success("오늘의 성찰이 저장되었습니다");
    } catch (error: any) {
      console.error('Error saving reflection:', error);
      toast.error(error?.message || "저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIFeedback = async () => {
    if (!reflection.trim()) {
      toast.error("성찰 내용을 먼저 작성해주세요");
      return;
    }

    setIsGettingFeedback(true);
    setAiFeedback("");
    
    try {
      const timeBlocks = await getTimeBlock(today);
      
      if (timeBlocks.length === 0) {
        toast.error("시간 기록이 없습니다. 시간 블록을 먼저 추가해주세요.");
        setIsGettingFeedback(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-feedback', {
        body: { 
          reflection,
          timeBlocks 
        }
      });

      if (error) {
        if (error.message.includes('429')) {
          toast.error("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
        } else if (error.message.includes('402')) {
          toast.error("사용 한도를 초과했습니다.");
        } else {
          throw error;
        }
        return;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAiFeedback(data.feedback);
      toast.success("AI 피드백이 생성되었습니다!");
    } catch (error) {
      console.error('Error getting AI feedback:', error);
      toast.error("AI 피드백 생성 중 오류가 발생했습니다");
    } finally {
      setIsGettingFeedback(false);
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
        <div className="flex justify-between items-center gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)]"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
        
        {aiFeedback && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <h4 className="font-semibold text-purple-900 dark:text-purple-100">AI 피드백</h4>
            </div>
            <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed whitespace-pre-line">
              {aiFeedback}
            </p>
          </div>
        )}
        
        <Button
          onClick={handleAIFeedback}
          disabled={isGettingFeedback || !reflection.trim()}
          variant="outline"
          className="w-full border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/20"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGettingFeedback ? "AI 피드백 생성 중..." : "오늘의 내 일상 AI로 피드백 받아보기"}
        </Button>
      </CardContent>
    </Card>
  );
};
