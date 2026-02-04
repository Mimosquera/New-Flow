/**
 * Date and Time Utility Functions Module
 * Provides helper functions for date/time parsing, formatting, and validation
 */

// Constants
const DEFAULT_LOCALE = 'en-US';
const HOURS_IN_HALF_DAY = 12;
const NOON_HOUR = 12;
const MONTHS_IN_YEAR = 12;

/**
 * Parse appointment date and time strings to create a Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {Date|null} JavaScript Date object or null if invalid
 */
export const parseAppointmentDateTime = (dateString, timeString) => {
  try {
    if (!dateString || !timeString) {
      console.error('Date and time strings are required');
      return null;
    }

    const dateParts = dateString.split('-').map(Number);
    const timeParts = timeString.split(':').map(Number);

    if (dateParts.length < 3 || timeParts.length < 2) {
      console.error('Invalid date or time format');
      return null;
    }

    const [year, month, day] = dateParts;
    const [hours, minutes] = timeParts;

    // Validate date components
    if (month < 1 || month > MONTHS_IN_YEAR || day < 1 || day > 31) {
      console.error('Invalid date values');
      return null;
    }

    // Validate time components
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time values');
      return null;
    }

    const date = new Date(year, month - 1, day, hours, minutes);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date created');
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing appointment date/time:', error);
    return null;
  }
};

/**
 * Check if an appointment date/time is in the future
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {boolean} True if the appointment is in the future, false otherwise
 */
export const isAppointmentUpcoming = (dateString, timeString) => {
  try {
    const appointmentDateTime = parseAppointmentDateTime(dateString, timeString);
    
    if (!appointmentDateTime) {
      return false;
    }

    const now = new Date();
    return appointmentDateTime > now;
  } catch (error) {
    console.error('Error checking if appointment is upcoming:', error);
    return false;
  }
};

/**
 * Format date for display with localization support
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} locale - Locale for formatting (e.g., 'en-US', 'es-ES')
 * @param {boolean} capitalize - Whether to capitalize the first letter
 * @returns {string} Formatted date string or original string if parsing fails
 */
export const formatDateDisplay = (dateString, locale = DEFAULT_LOCALE, capitalize = true) => {
  try {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString + 'T00:00:00'); // Add time to avoid timezone issues
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return dateString;
    }

    const formatted = date.toLocaleDateString(locale, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (capitalize && formatted) {
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    return formatted;
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return dateString;
  }
};

/**
 * Format time for display (convert 24-hour to 12-hour format)
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {string} Formatted time string (e.g., "2:30 PM") or original if invalid
 */
export const formatTimeDisplay = (timeString) => {
  try {
    if (!timeString) {
      return '';
    }

    const timeParts = timeString.split(':');
    
    if (timeParts.length < 2) {
      console.error('Invalid time format:', timeString);
      return timeString;
    }

    const [hours, minutes] = timeParts;
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error('Invalid time values:', timeString);
      return timeString;
    }

    const ampm = hour >= NOON_HOUR ? 'PM' : 'AM';
    const displayHour = hour % HOURS_IN_HALF_DAY || HOURS_IN_HALF_DAY;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeString;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayString = () => {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error getting today\'s date:', error);
    return '';
  }
};

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date, false otherwise
 */
export const isValidDateString = (dateString) => {
  try {
    if (!dateString || typeof dateString !== 'string') {
      return false;
    }

    const date = new Date(dateString + 'T00:00:00');
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Compare two date strings
 * @param {string} date1 - First date in YYYY-MM-DD format
 * @param {string} date2 - Second date in YYYY-MM-DD format
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2, null if invalid
 */
export const compareDates = (date1, date2) => {
  try {
    if (!date1 || !date2) {
      return null;
    }

    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return null;
    }

    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  } catch {
    return null;
  }
};
