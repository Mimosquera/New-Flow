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

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      console.error('Invalid date values');
      return null;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error('Invalid time values');
      return null;
    }

    const date = new Date(year, month - 1, day, hours, minutes);

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

export const formatDateDisplay = (dateString, locale = 'en-US', capitalize = true) => {
  try {
    if (!dateString) {
      return '';
    }

    // Add time to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    
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

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return timeString;
  }
};

export const getTodayString = () => {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error getting today\'s date:', error);
    return '';
  }
};

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
