import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { User } from '../models/User.js';

let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const sendEmail = async (to, subject, html) => {
  if (!emailTransporter) {
    console.log('Email service not configured. Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    await emailTransporter.sendMail({
      from: `"${process.env.BUSINESS_NAME || 'New Flow Salon'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent to:', to);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log('SMS service not configured. SMS would be sent to:', to);
    console.log('Message:', message);
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    const formattedPhone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
    
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    console.log('SMS sent to:', to);
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, message: error.message };
  }
};

export const sendAppointmentRequestConfirmation = async (appointment, service) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? 'Solicitud de Cita Recibida' : 'Appointment Request Received';
  const emailHtml = isEs
    ? `
    <h2>¡Gracias por su solicitud de cita!</h2>
    <p>Hola ${customerName},</p>
    <p>Hemos recibido su solicitud de cita para <strong>${service.name}</strong>.</p>
    <p><strong>Fecha:</strong> ${formattedDate}<br>
    <strong>Hora:</strong> ${formattedTime}</p>
    <p>Revisaremos su solicitud y nos pondremos en contacto con usted pronto por correo electrónico y mensaje de texto. Su cita NO está reservada hasta que reciba un correo de confirmación indicando que la cita ha sido aceptada.</p>
    <p>Si necesita cancelar esta solicitud, por favor <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}">haga clic aquí</a>.</p>
    <p>¿Preguntas? Llámenos al <strong>804-745-2525</strong></p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
    <p>¡Gracias!</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `
    : `
    <h2>Thank you for your appointment request!</h2>
    <p>Hi ${customerName},</p>
    <p>We've received your appointment request for <strong>${service.name}</strong>.</p>
    <p><strong>Date:</strong> ${formattedDate}<br>
    <strong>Time:</strong> ${formattedTime}</p>
    <p>We'll review your request and get back to you shortly via email and text message. Your appointment is NOT booked until you receive a confirmation email stating the appointment has been accepted.</p>
    <p>If you need to cancel this request, please <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}">click here</a>.</p>
    <p>Questions? Call us at <strong>804-745-2525</strong></p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>Thank you!</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const smsMessage = isEs
    ? `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Su solicitud de cita para ${service.name} el ${formattedDate} a las ${formattedTime} ha sido recibida. ¡Nos pondremos en contacto pronto!`
    : `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your appointment request for ${service.name} on ${formattedDate} at ${formattedTime} has been received. We'll contact you shortly!`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

export const notifyEmployeesOfNewAppointment = async (appointment, service, requestedEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const employees = await User.findAll({
    where: { isEmployee: true },
    attributes: ['email', 'name', 'emailLanguage', 'notificationSettings'],
  });

  const emailSubjectEn = 'New Appointment Request';
  const emailHtmlEn = `
    <h2>New Appointment Request</h2>
    <p>A new appointment request has been submitted:</p>
    <p><strong>Customer:</strong> ${customerName}<br>
    <strong>Email:</strong> ${customerEmail}<br>
    <strong>Phone:</strong> ${customerPhone}<br>
    <strong>Service:</strong> ${service.name}<br>
    <strong>Date:</strong> ${formattedDate}<br>
    <strong>Time:</strong> ${formattedTime}<br>
    <strong>Requested Employee:</strong> ${requestedEmployee ? requestedEmployee.name : 'No Preference'}</p>
    <p><a href="${process.env.CLIENT_URL}/employee-login" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">Go to Employee Dashboard</a></p>
    <p>Or copy this link: ${process.env.CLIENT_URL}/employee-login</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'} System</p>
  `;

  const emailSubjectEs = 'Nueva Solicitud de Cita';
  const emailHtmlEs = `
    <h2>Nueva Solicitud de Cita</h2>
    <p>Se ha enviado una nueva solicitud de cita:</p>
    <p><strong>Cliente:</strong> ${customerName}<br>
    <strong>Correo:</strong> ${customerEmail}<br>
    <strong>Teléfono:</strong> ${customerPhone}<br>
    <strong>Servicio:</strong> ${service.name}<br>
    <strong>Fecha:</strong> ${formattedDate}<br>
    <strong>Hora:</strong> ${formattedTime}<br>
    <strong>Empleado Solicitado:</strong> ${requestedEmployee ? requestedEmployee.name : 'Sin Preferencia'}</p>
    <p><a href="${process.env.CLIENT_URL}/employee-login" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">Ir al Panel de Empleados</a></p>
    <p>O copie este enlace: ${process.env.CLIENT_URL}/employee-login</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'} Sistema</p>
  `;

  const emailHtmlBoth = emailHtmlEn + '<hr>' + emailHtmlEs;

  const emailPromises = [];

  if (process.env.EMAIL_USER) {
    emailPromises.push(sendEmail(process.env.EMAIL_USER, emailSubjectEn, emailHtmlBoth));
  }

  employees.forEach(employee => {
    if (!employee.email) return;
    const settings = employee.notificationSettings || {};
    if (settings.newAppointments === false) return;
    const pref = employee.emailLanguage || 'both';
    if (pref === 'none') return;
    const subject = pref === 'es' ? emailSubjectEs : emailSubjectEn;
    const html = pref === 'en' ? emailHtmlEn : pref === 'es' ? emailHtmlEs : emailHtmlBoth;
    emailPromises.push(sendEmail(employee.email, subject, html));
  });

  await Promise.all(emailPromises);
};

export const sendAppointmentAcceptedNotification = async (appointment, service, acceptedByEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time, employeeNote, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? '¡Cita Confirmada!' : 'Appointment Confirmed!';
  const emailHtml = isEs
    ? `
    <h2>¡Su cita ha sido confirmada!</h2>
    <p>Hola ${customerName},</p>
    <p>¡Buenas noticias! Su cita ha sido confirmada por ${acceptedByEmployee.name}.</p>
    <p><strong>Servicio:</strong> ${service.name}<br>
    <strong>Fecha:</strong> ${formattedDate}<br>
    <strong>Hora:</strong> ${formattedTime}<br>
    <strong>Barbero/Estilista:</strong> ${acceptedByEmployee.name}</p>
    ${employeeNote ? `<p><strong>Nota de su barbero/estilista:</strong> ${employeeNote}</p>` : ''}
    <p>¡Esperamos verle pronto!</p>
    <p>Si necesita cancelar, por favor <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}">haga clic aquí</a> o llámenos al <strong>804-745-2525</strong>.</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `
    : `
    <h2>Your appointment has been confirmed!</h2>
    <p>Hi ${customerName},</p>
    <p>Great news! Your appointment has been confirmed by ${acceptedByEmployee.name}.</p>
    <p><strong>Service:</strong> ${service.name}<br>
    <strong>Date:</strong> ${formattedDate}<br>
    <strong>Time:</strong> ${formattedTime}<br>
    <strong>Barber/Stylist:</strong> ${acceptedByEmployee.name}</p>
    ${employeeNote ? `<p><strong>Note from your barber/stylist:</strong> ${employeeNote}</p>` : ''}
    <p>We look forward to seeing you!</p>
    <p>If you need to cancel, please <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}">click here</a> or call us at <strong>804-745-2525</strong>.</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const smsMessage = isEs
    ? `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Su cita el ${formattedDate} a las ${formattedTime} está CONFIRMADA con ${acceptedByEmployee.name}. ¡Nos vemos pronto!`
    : `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your appointment on ${formattedDate} at ${formattedTime} is CONFIRMED with ${acceptedByEmployee.name}. See you soon!`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

export const sendAppointmentDeclinedNotification = async (appointment, service, reason) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? 'Actualización de Cita' : 'Appointment Update';
  const emailHtml = isEs
    ? `
    <h2>Actualización de Cita</h2>
    <p>Hola ${customerName},</p>
    <p>Lamentablemente, no podemos acomodar su cita solicitada para <strong>${service.name}</strong> el ${formattedDate} a las ${formattedTime}.</p>
    ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
    <p>Por favor, siéntase libre de solicitar un horario diferente, o llámenos al <strong>804-745-2525</strong> para encontrar una alternativa.</p>
    <p>Pedimos disculpas por cualquier inconveniente y esperamos verle pronto.</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `
    : `
    <h2>Appointment Update</h2>
    <p>Hi ${customerName},</p>
    <p>Unfortunately, we're unable to accommodate your requested appointment for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime}.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please feel free to request a different time slot, or call us at <strong>804-745-2525</strong> to find an alternative that works for you.</p>
    <p>We apologize for any inconvenience and hope to see you soon!</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const smsMessage = isEs
    ? `${process.env.BUSINESS_NAME || 'New Flow Salon'}: No podemos confirmar su cita del ${formattedDate} a las ${formattedTime}. Por favor llámenos o reserve otro horario. ¡Disculpe las molestias!`
    : `${process.env.BUSINESS_NAME || 'New Flow Salon'}: We're unable to confirm your ${formattedDate} ${formattedTime} appointment. Please call us or book another time. Sorry for the inconvenience!`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

export const notifyEmployeeOfAcceptedAppointment = async (appointment, service, employee) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const fullEmployee = await User.findByPk(employee.id, { attributes: ['emailLanguage', 'notificationSettings'] });
  const settings = fullEmployee?.notificationSettings || {};
  if (settings.confirmations === false) return;
  const pref = fullEmployee?.emailLanguage || 'both';
  if (pref === 'none') return;

  const emailSubjectEn = 'Appointment Confirmed - You\'ve Been Booked';
  const emailHtmlEn = `
    <h2>Appointment Confirmed</h2>
    <p>Hi ${employee.name},</p>
    <p>You've successfully accepted and confirmed an appointment:</p>
    <p><strong>Service:</strong> ${service.name}<br>
    <strong>Date:</strong> ${formattedDate}<br>
    <strong>Time:</strong> ${formattedTime}<br>
    <strong>Customer:</strong> ${customerName}<br>
    <strong>Phone:</strong> ${customerPhone}<br>
    <strong>Email:</strong> ${customerEmail}</p>
    <p>The customer has been notified and expects to see you at the scheduled time.</p>
    <p><a href="${process.env.CLIENT_URL}/employee-login" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">View in Dashboard</a></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'} System</p>
  `;

  const emailSubjectEs = 'Cita Confirmada - Has Sido Reservado';
  const emailHtmlEs = `
    <h2>Cita Confirmada</h2>
    <p>Hola ${employee.name},</p>
    <p>Has aceptado y confirmado una cita exitosamente:</p>
    <p><strong>Servicio:</strong> ${service.name}<br>
    <strong>Fecha:</strong> ${formattedDate}<br>
    <strong>Hora:</strong> ${formattedTime}<br>
    <strong>Cliente:</strong> ${customerName}<br>
    <strong>Teléfono:</strong> ${customerPhone}<br>
    <strong>Correo:</strong> ${customerEmail}</p>
    <p>El cliente ha sido notificado y espera verte a la hora programada.</p>
    <p><a href="${process.env.CLIENT_URL}/employee-login" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">Ver en el Panel</a></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'} Sistema</p>
  `;

  const subject = pref === 'es' ? emailSubjectEs : emailSubjectEn;
  const html = pref === 'en' ? emailHtmlEn : pref === 'es' ? emailHtmlEs : emailHtmlEn + '<hr>' + emailHtmlEs;
  await sendEmail(employee.email, subject, html);
};
export const sendAppointmentCancelledNotification = async (appointment, service, cancelledBy = 'customer', wasPending = false) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  if (cancelledBy === 'customer') {
    const isPendingRequest = wasPending;

    const emailSubject = isEs
      ? (isPendingRequest ? 'Solicitud de Cita Cancelada' : 'Cita Cancelada')
      : (isPendingRequest ? 'Appointment Request Cancelled' : 'Appointment Cancelled');

    const emailHtml = isEs
      ? (isPendingRequest
        ? `
      <h2>Solicitud de Cita Cancelada</h2>
      <p>Hola ${customerName},</p>
      <p>Su solicitud de cita para <strong>${service.name}</strong> el ${formattedDate} a las ${formattedTime} ha sido cancelada exitosamente.</p>
      <p>¡Esperamos verlo pronto! Si lo desea, puede reservar otra cita en cualquier momento.</p>
      <p>¿Preguntas? Llámenos al <strong>804-745-2525</strong></p>
      <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
      <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
    `
        : `
      <h2>Cita Confirmada Cancelada</h2>
      <p>Hola ${customerName},</p>
      <p>Su cita confirmada para <strong>${service.name}</strong> el ${formattedDate} a las ${formattedTime} ha sido cancelada.</p>
      <p>Su barbero/estilista ha sido notificado de la cancelación.</p>
      <p>¡Esperamos verlo pronto! Si lo desea, puede reservar otra cita en cualquier momento.</p>
      <p>¿Preguntas? Llámenos al <strong>804-745-2525</strong></p>
      <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
      <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
    `)
      : (isPendingRequest
        ? `
      <h2>Appointment Request Cancelled</h2>
      <p>Hi ${customerName},</p>
      <p>Your appointment request for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime} has been successfully cancelled.</p>
      <p>We hope to see you again soon! Feel free to book another appointment anytime.</p>
      <p>Questions? Call us at <strong>804-745-2525</strong></p>
      <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
      <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
    `
        : `
      <h2>Confirmed Appointment Cancelled</h2>
      <p>Hi ${customerName},</p>
      <p>Your confirmed appointment for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime} has been cancelled.</p>
      <p>Your barber/stylist has been notified of the cancellation.</p>
      <p>We hope to see you again soon! Feel free to book another appointment anytime.</p>
      <p>Questions? Call us at <strong>804-745-2525</strong></p>
      <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
      <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
    `);

    const smsMessage = isEs
      ? `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Su cita del ${formattedDate} a las ${formattedTime} ha sido cancelada. ¡Esperamos verle pronto!`
      : `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your ${formattedDate} ${formattedTime} appointment has been cancelled. Hope to see you again soon!`;

    if (appointment.notifyByEmail !== false) {
      await sendEmail(customerEmail, emailSubject, emailHtml);
    }
    if (appointment.notifyBySms !== false) {
      await sendSMS(customerPhone, smsMessage);
    }
  }

  // Note: Employee notification for cancellations is handled by notifyEmployeeOfCancellation()
};

export const notifyEmployeeOfCancellation = async (appointment, service, employee) => {
  const { customerName, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const fullEmployee = await User.findByPk(employee.id, { attributes: ['emailLanguage', 'notificationSettings'] });
  const settings = fullEmployee?.notificationSettings || {};
  if (settings.cancellations === false) return;
  const pref = fullEmployee?.emailLanguage || 'both';
  if (pref === 'none') return;

  const emailSubjectEn = 'Appointment Cancelled by Customer';
  const emailHtmlEn = `
    <h2>Appointment Cancelled</h2>
    <p>Hi ${employee.name},</p>
    <p>Your confirmed appointment has been cancelled by the customer.</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Customer:</strong> ${customerName}</p>
      <p style="margin: 5px 0;"><strong>Service:</strong> ${service.name}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Time:</strong> ${formattedTime}</p>
      <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone}</p>
    </div>
    <p>This time slot is now available for other appointments.</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const emailSubjectEs = 'Cita Cancelada por el Cliente';
  const emailHtmlEs = `
    <h2>Cita Cancelada</h2>
    <p>Hola ${employee.name},</p>
    <p>Tu cita confirmada ha sido cancelada por el cliente.</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Cliente:</strong> ${customerName}</p>
      <p style="margin: 5px 0;"><strong>Servicio:</strong> ${service.name}</p>
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${formattedDate}</p>
      <p style="margin: 5px 0;"><strong>Hora:</strong> ${formattedTime}</p>
      <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${customerPhone}</p>
    </div>
    <p>Este horario ahora está disponible para otras citas.</p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const subject = pref === 'es' ? emailSubjectEs : emailSubjectEn;
  const html = pref === 'en' ? emailHtmlEn : pref === 'es' ? emailHtmlEs : emailHtmlEn + '<hr>' + emailHtmlEs;
  await sendEmail(employee.email, subject, html);
};

export const notifyCustomerOfEmployeeCancellation = async (appointment, service, employee, reason) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? 'Cita Cancelada' : 'Appointment Cancelled';
  const emailHtml = isEs
    ? `
    <h2>Cita Cancelada</h2>
    <p>Hola ${customerName},</p>
    <p>Lamentamos informarle que su cita confirmada para <strong>${service.name}</strong> el ${formattedDate} a las ${formattedTime} ha sido cancelada por su barbero/estilista, ${employee.name}.</p>
    ${reason ? `<p><strong>Razón:</strong> ${reason}</p>` : ''}
    <p>Nos disculpamos sinceramente por cualquier inconveniente. Por favor, siéntase libre de reservar otra cita o llámenos al <strong>804-745-2525</strong> para reprogramar.</p>
    <p>¡Esperamos atenderle pronto!</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `
    : `
    <h2>Appointment Cancelled</h2>
    <p>Hi ${customerName},</p>
    <p>We regret to inform you that your confirmed appointment for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime} has been cancelled by your barber/stylist, ${employee.name}.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>We sincerely apologize for any inconvenience this may cause. Please feel free to book another appointment or call us at <strong>804-745-2525</strong> to reschedule.</p>
    <p>We look forward to serving you soon!</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const smsMessage = isEs
    ? `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Su cita del ${formattedDate} a las ${formattedTime} ha sido cancelada. Nos disculpamos por el inconveniente. Llame al 804-745-2525 para reprogramar.`
    : `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your ${formattedDate} ${formattedTime} appointment has been cancelled. We apologize for the inconvenience. Please call 804-745-2525 to reschedule.`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const emailSubject = 'Password Reset Request';
  const emailHtml = `
    <h2>Password Reset Request</h2>
    <p>Hi ${name},</p>
    <p>You requested a password reset for your New Flow employee account.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">Reset Password</a></p>
    <p>Or copy this link: ${resetUrl}</p>
    <p><strong>This link will expire in 1 hour.</strong></p>
    <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
    <hr>
    <h2>Solicitud de Restablecimiento de Contraseña</h2>
    <p>Hola ${name},</p>
    <p>Solicitó restablecer la contraseña de su cuenta de empleado de New Flow.</p>
    <p>Haga clic en el enlace a continuación para restablecer su contraseña:</p>
    <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: rgb(5, 45, 63); color: white; text-decoration: none; border-radius: 4px; font-weight: 500; margin: 16px 0;">Restablecer Contraseña</a></p>
    <p>O copie este enlace: ${resetUrl}</p>
    <p><strong>Este enlace caducará en 1 hora.</strong></p>
    <p>Si no solicitó este restablecimiento, ignore este correo y su contraseña permanecerá sin cambios.</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Por favor, no responda a este correo ya que no es monitoreado. Para asistencia, llámenos al 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  await sendEmail(email, emailSubject, emailHtml);
};
