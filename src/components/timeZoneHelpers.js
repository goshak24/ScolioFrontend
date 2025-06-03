import { format, isToday, isYesterday } from 'date-fns';

const getFormattedDate = (date = new Date()) => {
    try {
        // Use local timezone to avoid date shifting issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        // Fallback to current date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};

// Convert Firestore timestamp to date string with error handling
const getDateStringFromFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    try {
        let date;
        
        // Handle different timestamp formats
        if (timestamp._seconds !== undefined && timestamp._nanoseconds !== undefined) {
            // Firestore timestamp object
            const milliseconds = timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
            date = new Date(milliseconds);
        } else if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
            // Alternative Firestore timestamp format
            const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
            date = new Date(milliseconds);
        } else if (timestamp instanceof Date) {
            // Already a Date object
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            // String format
            date = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
            // Unix timestamp
            date = new Date(timestamp);
        } else {
            console.warn('Unknown timestamp format:', timestamp);
            return null;
        }
        
        // Validate the date
        if (isNaN(date.getTime())) {
            console.error('Invalid date created from timestamp:', timestamp);
            return null;
        }
        
        // Check if date is within reasonable bounds (e.g., between 1970 and 2050)
        const year = date.getFullYear();
        if (year < 1970 || year > 2050) {
            console.error('Date out of reasonable bounds:', date);
            return null;
        }
        
        return getFormattedDate(date);
        
    } catch (error) {
        console.error('Error converting Firestore timestamp:', error, timestamp);
        return null;
    }
};

const MDYformatTimestamp = (timestamp) => {
        if (!timestamp) return "";

        try {
            // Handle Firebase timestamp object
            let date;
            if (timestamp._seconds) {
                date = new Date(timestamp._seconds * 1000);
            } else if (timestamp.seconds) {
                date = new Date(timestamp.seconds * 1000);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else {
                return ""; // Return empty string for invalid timestamps
            }
            
            // Check if date is valid before formatting
            if (isNaN(date.getTime())) {
                return "";
            }

            if (isToday(date)) {
                return format(date, 'h:mm a');
            } else if (isYesterday(date)) {
                return 'Yesterday';
            } else {
                return format(date, 'MM/dd/yyyy');
            }
        } catch (error) {
            console.warn("Error formatting timestamp:", error);
            return "";
        }
    };

export { getFormattedDate, getDateStringFromFirestoreTimestamp, MDYformatTimestamp };