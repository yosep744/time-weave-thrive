import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getTimeBlocksForDateRange } from "@/lib/timeBlockStorage";
import { saveTimeBlock } from "@/lib/timeBlockStorage";

export const GoogleSheetsSync = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      // Get all time blocks from the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const blocks = getTimeBlocksForDateRange(startDate, endDate);
      
      if (blocks.length === 0) {
        toast({
          title: "데이터 없음",
          description: "업로드할 시간 기록이 없습니다.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: { action: 'upload', data: blocks }
      });

      if (error) throw error;

      toast({
        title: "업로드 완료",
        description: `${data.rowsAdded}개의 시간 기록이 Google Sheets에 업로드되었습니다.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: { action: 'download' }
      });

      if (error) throw error;

      // Group blocks by date and save to localStorage
      const blocksByDate: Record<string, any[]> = {};
      data.data.forEach((block: any) => {
        if (!blocksByDate[block.date]) {
          blocksByDate[block.date] = [];
        }
        blocksByDate[block.date].push({
          id: crypto.randomUUID(),
          startTime: block.startTime,
          endTime: block.endTime,
          category: block.category,
          activity: block.activity,
        });
      });

      // Save to localStorage
      Object.entries(blocksByDate).forEach(([date, blocks]) => {
        saveTimeBlock(date, blocks);
      });

      toast({
        title: "다운로드 완료",
        description: `${data.data.length}개의 시간 기록이 다운로드되었습니다. 페이지를 새로고침하세요.`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "다운로드 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Cloud className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Google Sheets 동기화</h3>
          <p className="text-sm text-muted-foreground">
            시간 기록을 Google Sheets와 동기화하세요
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="flex-1 gap-2"
          variant="default"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "업로드 중..." : "업로드"}
        </Button>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "다운로드 중..." : "다운로드"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        💡 업로드: 최근 30일 데이터를 Google Sheets로 전송<br />
        💡 다운로드: Google Sheets의 데이터를 로컬에 저장
      </p>
    </Card>
  );
};
