import { supabase } from "@/integrations/supabase/client";
import { getTimeBlocksForDateRange } from "./timeBlockStorage";

export const syncToGoogleSheets = async (showToast = false) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const blocks = getTimeBlocksForDateRange(startDate, endDate);
  
  if (blocks.length === 0) {
    return { success: false, message: "No data to upload" };
  }

  const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
    body: { action: 'upload', data: blocks }
  });

  if (error) throw error;

  return { success: true, data, showToast };
};
