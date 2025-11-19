import { TimeBlockExport } from "@/components/TimeEntry";
import { supabase } from "@/integrations/supabase/client";

export const saveTimeBlock = async (date: string, blocks: any[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("User not authenticated - skipping save");
    throw new Error("User not authenticated");
  }

  try {
    console.log(`Saving ${blocks.length} blocks for date ${date} user ${user.id}`);

    // Delete existing blocks for this date and user
    const { error: deleteError } = await supabase
      .from('time_blocks')
      .delete()
      .eq('date', date)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting old blocks:', deleteError);
      throw deleteError;
    }

    // Insert new blocks
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map(block => ({
        date,
        start_time: block.startTime,
        end_time: block.endTime,
        category: block.category,
        activity: block.activity || null,
        user_id: user.id,
      }));

      const { error: insertError } = await supabase
        .from('time_blocks')
        .insert(blocksToInsert);

      if (insertError) {
        console.error('Error inserting new blocks:', insertError);
        throw insertError;
      }
    }

    // Dispatch custom event for instant UI updates
    window.dispatchEvent(new CustomEvent('timeBlocksUpdated'));
  } catch (error) {
    console.error('Error saving time blocks:', error);
    throw error;
  }
};

export const getTimeBlock = async (date: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('date', date)
    .eq('user_id', user.id)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching time blocks:', error);
    throw error;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('label', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data;
};

export const saveCategories = async (categories: any[]) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Delete all existing categories for this user
  await supabase
    .from('categories')
    .delete()
    .eq('user_id', user.id);

  // Insert new categories with upsert to avoid duplicates
  if (categories.length > 0) {
    const categoriesToInsert = categories.map(cat => ({
      value: cat.value,
      label: cat.label,
      color: cat.color,
      user_id: user.id,
    }));

    await supabase
      .from('categories')
      .upsert(categoriesToInsert, {
        onConflict: 'value,user_id',
        ignoreDuplicates: false
      });
  }

  // Dispatch custom event for instant UI updates
  window.dispatchEvent(new CustomEvent('timeBlocksUpdated'));
};
