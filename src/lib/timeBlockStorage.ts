import { TimeBlockExport } from "@/components/TimeEntry";

export const saveTimeBlock = (date: string, blocks: any[]) => {
  localStorage.setItem(`timeBlocks-${date}`, JSON.stringify(blocks));
  
  // Trigger real-time sync to Google Sheets if auto-sync is enabled
  const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
  if (autoSyncEnabled) {
    import('./googleSheetsSync').then(({ syncToGoogleSheets }) => {
      syncToGoogleSheets(false).catch(err => {
        console.error('Failed to sync to Google Sheets:', err);
      });
    });
  }
};

export const getTimeBlock = (date: string) => {
  const saved = localStorage.getItem(`timeBlocks-${date}`);
  return saved ? JSON.parse(saved) : [];
};

export const getTimeBlocksForDateRange = (startDate: Date, endDate: Date): TimeBlockExport[] => {
  const blocks: TimeBlockExport[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayBlocks = getTimeBlock(dateStr);
    
    dayBlocks.forEach((block: any) => {
      blocks.push({
        ...block,
        date: dateStr,
      });
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return blocks;
};

export const getCategoryStats = (blocks: TimeBlockExport[]) => {
  const stats: Record<string, number> = {};
  
  blocks.forEach(block => {
    if (!block.startTime || !block.endTime) return;
    
    const [startHour, startMin] = block.startTime.split(":").map(Number);
    const [endHour, endMin] = block.endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = (endMinutes - startMinutes) / 60; // hours
    
    if (duration > 0) {
      stats[block.category] = (stats[block.category] || 0) + duration;
    }
  });
  
  return stats;
};

export const getCategories = () => {
  const saved = localStorage.getItem('categories');
  return saved ? JSON.parse(saved) : [];
};
