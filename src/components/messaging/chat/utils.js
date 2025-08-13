import { format, isToday, isYesterday } from 'date-fns';

/**
 * Format a message timestamp into a readable time string
 * @param {any} timestamp - The timestamp to format (can be various formats)
 * @returns {string} Formatted time string
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  
  try {
    const date = toDate(timestamp);
    if (!date) return format(new Date(), 'h:mm a');
    return format(date, 'h:mm a');
  } catch (error) {
    // Default to current time on error
    return format(new Date(), 'h:mm a');
  }
};

// Convert various timestamp shapes to a valid Date or null
export const toDate = (timestamp) => {
  try {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;
    if (timestamp._seconds) {
      const d = new Date(timestamp._seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (timestamp.seconds) {
      const d = new Date(timestamp.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const d = new Date(timestamp);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch {
    return null;
  }
};

// Returns a YYYY-MM-DD key in local time for grouping
export const getDayKey = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
};

// Returns a human-friendly day label (Today, Yesterday, or formatted date)
export const formatMessageDayLabel = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return '';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d, yyyy');
};
