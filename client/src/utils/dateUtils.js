export const parseAppointmentDateTime = (dateString, timeString) => {
  if (!dateString || !timeString) return null;

  const dateParts = dateString.split('-').map(Number);
  const timeParts = timeString.split(':').map(Number);

  if (dateParts.length < 3 || timeParts.length < 2) return null;

  const [year, month, day] = dateParts;
  const [hours, minutes] = timeParts;

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const date = new Date(year, month - 1, day, hours, minutes);
  return isNaN(date.getTime()) ? null : date;
};

export const isAppointmentUpcoming = (dateString, timeString) => {
  const appointmentDateTime = parseAppointmentDateTime(dateString, timeString);
  return appointmentDateTime ? appointmentDateTime > new Date() : false;
};

export const formatDateDisplay = (dateString, locale = 'en-US', capitalize = true) => {
  if (!dateString) return '';

  const date = new Date(dateString + 'T00:00:00');
  if (isNaN(date.getTime())) return dateString;

  const formatted = date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return capitalize && formatted
    ? formatted.charAt(0).toUpperCase() + formatted.slice(1)
    : formatted;
};

export const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';

  const timeParts = timeString.split(':');
  if (timeParts.length < 2) return timeString;

  const hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return timeString;
  }

  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const isValidDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return false;
  return !isNaN(new Date(dateString + 'T00:00:00').getTime());
};

export const compareDates = (date1, date2) => {
  if (!date1 || !date2) return null;

  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};
