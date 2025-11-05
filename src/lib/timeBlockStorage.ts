import { TimeBlockExport } from "@/components/TimeEntry";
import { supabase } from "@/integrations/supabase/client";

export const saveTimeBlock = async (date: string, blocks: any[]) => {
  // Delete existing blocks for this date
  await supabase
    .from('time_blocks')
    .delete()
    .eq('date', date);

  // Insert new blocks
  if (blocks.length > 0) {
    const blocksToInsert = blocks.map(block => ({
      date,
      start_time: block.startTime,
      end_time: block.endTime,
      category: block.category,
      activity: block.activity || null,
    }));

    await supabase
      .from('time_blocks')
      .insert(blocksToInsert);
  }

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

export const getTimeBlock = async (date: string) => {
  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching time blocks:', error);
    return [];
  }

  return data.map(block => ({
    id: block.id,
    startTime: block.start_time,
    endTime: block.end_time,
    category: block.category,
    activity: block.activity || '',
  }));
};

export const getTimeBlocksForDateRange = async (startDate: Date, endDate: Date): Promise<TimeBlockExport[]> => {
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching time blocks for date range:', error);
    return [];
  }

  return data.map(block => ({
    id: block.id,
    date: block.date,
    startTime: block.start_time,
    endTime: block.end_time,
    category: block.category,
    activity: block.activity || '',
  }));
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

export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('label', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data;
};

export const saveCategories = async (categories: any[]) => {
  // Delete all existing categories
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert new categories
  if (categories.length > 0) {
    const categoriesToInsert = categories.map(cat => ({
      value: cat.value,
      label: cat.label,
      color: cat.color,
    }));

    await supabase
      .from('categories')
      .insert(categoriesToInsert);
  }
};
