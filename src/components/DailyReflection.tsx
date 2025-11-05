import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DailyReflection = () => {
  const today = new Date().toISOString().split('T')[0];
  const [reflection, setReflection] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load reflection from Supabase
  useEffect(() => {
    const loadReflection = async () => {
      const { data, error } = await supabase
        .from('reflections')
        .select('content')
        .eq('date', today)
        .maybeSingle();

      if (!error && data) {
        setReflection(data.content);
      }
    };

    loadReflection();
  }, [today]);

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel('reflection_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reflections',
          filter: `date=eq.${today}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setReflection((payload.new as any).content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [today]);

  const handleSave = async () => {
    if (!reflection.trim()) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('reflections')
        .upsert({
          date: today,
          content: reflection,
        }, {
          onConflict: 'date'
        });

      if (error) throw error;
      
      toast.success("오늘의 성찰이 저장되었습니다");
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
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
            disabled={isSaving}
            className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-[var(--shadow-soft)] transition-[var(--transition-smooth)]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
