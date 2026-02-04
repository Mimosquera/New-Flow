/**
 * Date and time utility functions
 */

/**
 * Parse appointment date and time strings to create a Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {Date} JavaScript Date object
 */
export const parseAppointmentDateTime = (dateString, timeString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

/**
 * Check if an appointment date/time is in the future
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format
 * @returns {boolean} True if the appointment is in the future
 */
export const isAppointmentUpcoming = (dateString, timeString) => {
  const appointmentDateTime = parseAppointmentDateTime(dateString, timeString);
  return appointmentDateTime > new Date();
};
