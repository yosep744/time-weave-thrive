/**
 * Convert time string to minutes since midnight
 * @param timeStr format "HH:MM" like "07:30"
 * @returns minutes since midnight (450 for "07:30")
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  
  const [hours, minutes] = timeStr.split(':').map(str => parseInt(str, 10));
  
  // Validate parsed values
  if (isNaN(hours) || isNaN(minutes)) return 0;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return 0;
  
  return hours * 60 + minutes;
}

/**
 * Calculate duration between two time strings
 * @param startTime format "HH:MM"
 * @param endTime format "HH:MM"
 * @returns duration in minutes
 */
function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  let duration = endMinutes - startMinutes;
  
  // Handle day overflow (e.g., 23:00 to 01:00)
  if (duration < 0) {
    duration += 24 * 60; // Add 24 hours
  }
  
  return duration;
}

/**
 * Format minutes to display string
 * @param totalMinutes total minutes
 * @returns formatted string like "4시간 30분" or "45분"
 */
function formatMinutesToDisplay(totalMinutes: number): string {
  if (totalMinutes === 0) return "0분";
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
}

// Type definitions
interface TimeBlock {
  id: string;
  startTime: string;  // "HH:MM" format
  endTime: string;    // "HH:MM" format
  category: string;
  activity: string;
  date?: string;
}

interface CategoryTotal {
  totalMinutes: number;
  displayText: string;  // "4시간 30분"
  percentage: number;   // 0-100
  blocks: TimeBlock[];
}

interface CategoryTotals {
  [category: string]: CategoryTotal;
}

/**
 * Calculate total time for each category
 * @param timeBlocks array of time blocks
 * @returns object with category totals
 */
export function calculateCategoryTotals(timeBlocks: TimeBlock[]): CategoryTotals {
  const categories = ['work', 'study', 'exercise', 'leisure', 'rest', 'other'];
  const totals: CategoryTotals = {};
  
  // Initialize all categories with 0
  categories.forEach(cat => {
    totals[cat] = {
      totalMinutes: 0,
      displayText: "0분",
      percentage: 0,
      blocks: []
    };
  });
  
  // Calculate for each block
  timeBlocks.forEach(block => {
    if (!block.category || !block.startTime || !block.endTime) return;
    
    const duration = calculateDuration(block.startTime, block.endTime);
    
    if (totals[block.category]) {
      totals[block.category].totalMinutes += duration;
      totals[block.category].blocks.push(block);
    }
  });
  
  // Calculate total tracked time
  const totalTrackedMinutes = Object.values(totals).reduce(
    (sum, cat) => sum + cat.totalMinutes, 
    0
  );
  
  // Format display text and calculate percentages
  Object.keys(totals).forEach(category => {
    totals[category].displayText = formatMinutesToDisplay(totals[category].totalMinutes);
    
    // Percentage of tracked time (not 24 hours)
    if (totalTrackedMinutes > 0) {
      totals[category].percentage = 
        Math.round((totals[category].totalMinutes / totalTrackedMinutes) * 100);
    }
  });
  
  return totals;
}
