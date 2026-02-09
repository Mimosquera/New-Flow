export const parseAppointmentDateTime = (dateString, timeString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

export const isAppointmentUpcoming = (dateString, timeString) => {
  const appointmentDateTime = parseAppointmentDateTime(dateString, timeString);
  return appointmentDateTime > new Date();
};
