import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const goalSchema = z.string().trim().min(1, "목표를 입력해주세요").max(200, "목표는 200자 이내로 입력해주세요");

export function WeeklyGoals() {
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weekStart, setWeekStart] = useState<string>('');

  // Get the start of the current week (Monday)
  const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  useEffect(() => {
    const start = getWeekStart();
    setWeekStart(start);
    loadGoals(start);
  }, []);

  const loadGoals = async (start: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weekly_goals')
        .select('goals')
        .eq('user_id', user.id)
        .eq('week_start', start)
        .maybeSingle();

      if (error) throw error;

      if (data?.goals) {
        setGoals(data.goals);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const saveGoals = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      // Use upsert for faster saving
      const { error } = await supabase
        .from('weekly_goals')
        .upsert({
          user_id: user.id,
          week_start: weekStart,
          goals
        }, {
          onConflict: 'user_id,week_start'
        });

      if (error) throw error;

      toast.success('목표가 저장되었습니다');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('목표 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const addGoal = () => {
    try {
      const validated = goalSchema.parse(newGoal);
      
      if (goals.length >= 10) {
        toast.error('목표는 최대 10개까지 추가할 수 있습니다');
        return;
      }

      setGoals([...goals, validated]);
      setNewGoal('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newGoal.trim()) {
      addGoal();
    }
  };

  return (
    <Card className="relative overflow-hidden hover-lift">
      <div 
        className="absolute inset-0 opacity-5"
        style={{ background: 'var(--gradient-primary)' }}
      />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            이번 주 목표
          </h3>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="hover-scale"
            >
              수정
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  loadGoals(weekStart);
                }}
              >
                취소
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={saveGoals}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          )}
        </div>

        {goals.length === 0 && !isEditing ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              아직 설정된 목표가 없습니다
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              목표 추가하기
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {goals.map((goal, index) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 transition-all animate-fade-in"
              >
                <span className="text-primary font-bold flex-shrink-0">•</span>
                <span className="text-foreground flex-1 break-words">{goal}</span>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGoal(index)}
                    className="h-6 w-6 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isEditing && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="새로운 목표를 입력하세요 (최대 200자)"
                maxLength={200}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addGoal}
                disabled={!newGoal.trim()}
                className="hover-scale flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter 키를 눌러 목표를 추가할 수 있습니다 (최대 10개)
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
