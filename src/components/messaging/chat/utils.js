import { format } from 'date-fns';

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
    let date;
    
    // Handle different timestamp formats
    if (timestamp._seconds) {
      // Firestore timestamp
      date = new Date(timestamp._seconds * 1000);
    } else if (timestamp.seconds) {
      // Alternative Firestore timestamp format
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      // Handle ISO string format
      date = new Date(timestamp);
    } else {
      // Default to current time if we can't determine format
      return format(new Date(), 'h:mm a');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Default to current time if date is invalid
      return format(new Date(), 'h:mm a');
    }
    
    return format(date, 'h:mm a');
  } catch (error) {
    // Default to current time on error
    return format(new Date(), 'h:mm a');
  }
};
