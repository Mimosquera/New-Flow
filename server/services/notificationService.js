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

// ── Formatting helpers ──────────────────────────────────────────────

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateEs = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// ── Brand constants ─────────────────────────────────────────────────

const BRAND = process.env.BUSINESS_NAME || 'New Flow Salon';
const PHONE = '804-745-2525';
const BRAND_COLOR = '#053c52';
const ACCENT_COLOR = '#3aabdb';

// ── Email template helpers ──────────────────────────────────────────

const formatPrice = (service) => {
  if (!service || !service.price) return '';
  return service.price_max ? `$${service.price} – $${service.price_max}` : `$${service.price}`;
};

const emailWrapper = (bodyContent, lang = 'en') => {
  const logoUrl = process.env.LOGO_URL;
  const footerNote = lang === 'es'
    ? 'Este es un mensaje automático. Por favor no responda a este correo.'
    : lang === 'both'
    ? 'This is an automated message. Please do not reply. · Mensaje automático, por favor no responda.'
    : 'This is an automated message. Please do not reply to this email.';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background-color:#f4f5f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust:100%;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f6; padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">
  <tr><td style="padding:28px 36px 20px; text-align:center;">
    ${logoUrl ? `<img src="${logoUrl}" alt="${BRAND}" style="max-height:50px; margin-bottom:8px;" /><br/>` : ''}
    <span style="font-size:20px; font-weight:700; color:${BRAND_COLOR}; letter-spacing:0.5px;">${BRAND}</span>
  </td></tr>
  <tr><td style="height:3px; background:linear-gradient(to right, ${BRAND_COLOR}, ${ACCENT_COLOR});"></td></tr>
  <tr><td style="padding:28px 36px;">${bodyContent}</td></tr>
  <tr><td style="padding:20px 36px; background-color:#f8f9fa; border-top:1px solid #eee; text-align:center;">
    <p style="margin:0 0 6px; font-size:13px; color:${BRAND_COLOR}; font-weight:600;">${BRAND}</p>
    <p style="margin:0 0 10px; font-size:13px;"><a href="tel:${PHONE.replace(/-/g, '')}" style="color:${ACCENT_COLOR}; text-decoration:none;">${PHONE}</a></p>
    <p style="margin:0; font-size:11px; color:#aaa; line-height:1.4;">${footerNote}</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
};

const detailsBlock = (items) => {
  const rows = items
    .filter(([, val]) => val !== undefined && val !== null && val !== '')
    .map(([label, value]) =>
      `<tr><td style="padding:5px 12px 5px 0; color:#888; font-size:13px; vertical-align:top; white-space:nowrap;">${label}</td><td style="padding:5px 0; color:#333; font-size:13px; font-weight:600;">${value}</td></tr>`
    ).join('');
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0 20px; border-left:3px solid ${ACCENT_COLOR}; padding-left:16px;">${rows}</table>`;
};

const ctaButton = (href, text) =>
  `<div style="text-align:center; margin:24px 0;"><a href="${href}" style="display:inline-block; padding:12px 28px; background-color:${BRAND_COLOR}; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px;">${text}</a></div>`;

const noteBlock = (title, content) =>
  `<div style="margin:12px 0 20px; padding:12px 16px; background-color:#f0f7ff; border-left:3px solid ${ACCENT_COLOR}; border-radius:0 4px 4px 0;">
    <p style="margin:0 0 2px; font-size:12px; color:#888; font-weight:600;">${title}</p>
    <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">${content}</p>
  </div>`;

const warningBlock = (title, content) =>
  `<div style="margin:20px 0; padding:14px 16px; background-color:#fff8e1; border-left:3px solid #ffc107; border-radius:0 4px 4px 0;">
    <p style="margin:0 0 4px; font-size:13px; color:#856404; font-weight:700;">${title}</p>
    <p style="margin:0; font-size:13px; color:#856404; line-height:1.5;">${content}</p>
  </div>`;

const bilingualDivider = `<div style="margin:28px 0; text-align:center; position:relative;">
  <div style="border-top:1px solid #e0e0e0;"></div>
  <span style="background:#ffffff; padding:0 14px; font-size:11px; color:#bbb; position:relative; top:-9px; display:inline-block;">ESPAÑOL</span>
</div>`;

// ── Transport functions ─────────────────────────────────────────────

const sendEmail = async (to, subject, html) => {
  if (!emailTransporter) {
    console.log('Email service not configured. Email would be sent to:', to);
    console.log('Subject:', subject);
    console.log('Content:', html);
    return { success: false, message: 'Email service not configured' };
  }

  try {
    await emailTransporter.sendMail({
      from: `"${BRAND}" <${process.env.EMAIL_USER}>`,
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

// ── Customer: Appointment Request Received ──────────────────────────

export const sendAppointmentRequestConfirmation = async (appointment, service) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';
  const priceDisplay = formatPrice(service);

  const emailSubject = isEs ? 'Solicitud de Cita Recibida' : 'Appointment Request Received';

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Thank you for requesting an appointment with us! Here are your booking details:</p>
    ${detailsBlock([
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
      ['Price', priceDisplay],
    ])}
    ${warningBlock('Pending Review', 'Your appointment is <strong>not yet confirmed</strong>. We will review your request and notify you by email and text once it has been accepted.')}
    <p style="font-size:13px; color:#555; line-height:1.6;">Need to cancel? <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}" style="color:${ACCENT_COLOR}; font-weight:600; text-decoration:none;">Cancel this request</a> or call us at <strong>${PHONE}</strong>.</p>
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">¡Gracias por solicitar una cita con nosotros! Aquí están los detalles de su reserva:</p>
    ${detailsBlock([
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
      ['Precio', priceDisplay],
    ])}
    ${warningBlock('Pendiente de Revisión', 'Su cita <strong>aún no está confirmada</strong>. Revisaremos su solicitud y le notificaremos por correo y mensaje de texto una vez que haya sido aceptada.')}
    <p style="font-size:13px; color:#555; line-height:1.6;">¿Necesita cancelar? <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}" style="color:${ACCENT_COLOR}; font-weight:600; text-decoration:none;">Cancelar esta solicitud</a> o llámenos al <strong>${PHONE}</strong>.</p>
  `;

  const emailHtml = emailWrapper(isEs ? bodyEs : bodyEn, isEs ? 'es' : 'en');

  const smsMessage = isEs
    ? `${BRAND}: Solicitud de cita recibida — ${service.name}, ${formatDateEs(date)} a las ${formattedTime}. Le notificaremos cuando sea aceptada. Tel: ${PHONE}`
    : `${BRAND}: Appointment request received — ${service.name}, ${formattedDate} at ${formattedTime}. We'll notify you once accepted. Tel: ${PHONE}`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

// ── Employees: New Appointment Request ──────────────────────────────

export const notifyEmployeesOfNewAppointment = async (appointment, service, requestedEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time, customerNotes } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const employees = await User.findAll({
    where: { isEmployee: true },
    attributes: ['email', 'name', 'emailLanguage', 'notificationSettings'],
  });

  const bodyEn = `
    <p style="font-size:16px; color:${BRAND_COLOR}; font-weight:700; margin:0 0 8px;">New Appointment Request</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">A new booking request has been submitted. Please review it in your dashboard.</p>
    ${detailsBlock([
      ['Customer', customerName],
      ['Phone', customerPhone],
      ['Email', customerEmail],
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
      ['Requested', requestedEmployee ? requestedEmployee.name : 'No Preference'],
    ])}
    ${customerNotes ? noteBlock('Customer Notes', customerNotes) : ''}
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'Open Dashboard')}
  `;

  const bodyEs = `
    <p style="font-size:16px; color:${BRAND_COLOR}; font-weight:700; margin:0 0 8px;">Nueva Solicitud de Cita</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Se ha recibido una nueva solicitud de reserva. Revísela en su panel.</p>
    ${detailsBlock([
      ['Cliente', customerName],
      ['Teléfono', customerPhone],
      ['Correo', customerEmail],
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
      ['Solicitado', requestedEmployee ? requestedEmployee.name : 'Sin Preferencia'],
    ])}
    ${customerNotes ? noteBlock('Notas del Cliente', customerNotes) : ''}
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'Abrir Panel')}
  `;

  const emailSubjectEn = 'New Appointment Request';
  const emailSubjectEs = 'Nueva Solicitud de Cita';

  const emailHtmlEn = emailWrapper(bodyEn, 'en');
  const emailHtmlEs = emailWrapper(bodyEs, 'es');
  const emailHtmlBoth = emailWrapper(bodyEn + bilingualDivider + bodyEs, 'both');

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

// ── Customer: Appointment Confirmed ─────────────────────────────────

export const sendAppointmentAcceptedNotification = async (appointment, service, acceptedByEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time, employeeNote, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';
  const priceDisplay = formatPrice(service);

  const emailSubject = isEs ? '¡Cita Confirmada!' : 'Appointment Confirmed!';

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Great news — your appointment has been confirmed! Here are your details:</p>
    ${detailsBlock([
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
      ['Price', priceDisplay],
      ['Stylist', acceptedByEmployee.name],
    ])}
    ${employeeNote ? noteBlock(`Note from ${acceptedByEmployee.name}`, employeeNote) : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">We look forward to seeing you!</p>
    <p style="font-size:13px; color:#555; line-height:1.6;">Need to cancel? <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}" style="color:${ACCENT_COLOR}; font-weight:600; text-decoration:none;">Cancel this appointment</a> or call us at <strong>${PHONE}</strong>.</p>
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">¡Buenas noticias — su cita ha sido confirmada! Aquí están sus detalles:</p>
    ${detailsBlock([
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
      ['Precio', priceDisplay],
      ['Estilista', acceptedByEmployee.name],
    ])}
    ${employeeNote ? noteBlock(`Nota de ${acceptedByEmployee.name}`, employeeNote) : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">¡Esperamos verle pronto!</p>
    <p style="font-size:13px; color:#555; line-height:1.6;">¿Necesita cancelar? <a href="${process.env.CLIENT_URL}/cancel-appointment/${appointment.id}" style="color:${ACCENT_COLOR}; font-weight:600; text-decoration:none;">Cancelar esta cita</a> o llámenos al <strong>${PHONE}</strong>.</p>
  `;

  const emailHtml = emailWrapper(isEs ? bodyEs : bodyEn, isEs ? 'es' : 'en');

  const smsMessage = isEs
    ? `${BRAND}: ¡Cita CONFIRMADA! ${service.name}, ${formatDateEs(date)} a las ${formattedTime} con ${acceptedByEmployee.name}. ¡Nos vemos pronto!`
    : `${BRAND}: Appointment CONFIRMED! ${service.name}, ${formattedDate} at ${formattedTime} with ${acceptedByEmployee.name}. See you soon!`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

// ── Customer: Appointment Declined ──────────────────────────────────

export const sendAppointmentDeclinedNotification = async (appointment, service, reason) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? 'Actualización de Cita' : 'Appointment Update';

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Unfortunately, we're unable to accommodate your requested appointment:</p>
    ${detailsBlock([
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
    ])}
    ${reason ? `<div style="margin:12px 0 20px; padding:12px 16px; background-color:#f8f9fa; border-left:3px solid #6c757d; border-radius:0 4px 4px 0;">
      <p style="margin:0 0 2px; font-size:12px; color:#888; font-weight:600;">Reason</p>
      <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">${reason}</p>
    </div>` : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">We'd love to find a time that works for you. Please book a different slot or call us at <strong>${PHONE}</strong>.</p>
    ${ctaButton(`${process.env.CLIENT_URL}`, 'Book Another Time')}
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Lamentablemente, no podemos acomodar la cita solicitada:</p>
    ${detailsBlock([
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
    ])}
    ${reason ? `<div style="margin:12px 0 20px; padding:12px 16px; background-color:#f8f9fa; border-left:3px solid #6c757d; border-radius:0 4px 4px 0;">
      <p style="margin:0 0 2px; font-size:12px; color:#888; font-weight:600;">Razón</p>
      <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">${reason}</p>
    </div>` : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">Nos encantaría encontrar un horario que le convenga. Reserve otro horario o llámenos al <strong>${PHONE}</strong>.</p>
    ${ctaButton(`${process.env.CLIENT_URL}`, 'Reservar Otro Horario')}
  `;

  const emailHtml = emailWrapper(isEs ? bodyEs : bodyEn, isEs ? 'es' : 'en');

  const smsMessage = isEs
    ? `${BRAND}: No pudimos confirmar su cita del ${formatDateEs(date)} a las ${formattedTime}. Reserve otro horario o llámenos al ${PHONE}.`
    : `${BRAND}: We couldn't confirm your ${formattedDate} at ${formattedTime} appointment. Please book another time or call ${PHONE}.`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

// ── Employee: You've Been Booked ────────────────────────────────────

export const notifyEmployeeOfAcceptedAppointment = async (appointment, service, employee) => {
  const { customerName, customerEmail, customerPhone, date, time, customerNotes } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const fullEmployee = await User.findByPk(employee.id, { attributes: ['emailLanguage', 'notificationSettings'] });
  const settings = fullEmployee?.notificationSettings || {};
  if (settings.confirmations === false) return;
  const pref = fullEmployee?.emailLanguage || 'both';
  if (pref === 'none') return;

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${employee.name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">You've confirmed a new appointment. Here are the details:</p>
    ${detailsBlock([
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
      ['Customer', customerName],
      ['Phone', customerPhone],
      ['Email', customerEmail],
    ])}
    ${customerNotes ? noteBlock('Customer Notes', customerNotes) : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">The customer has been notified and will see you at the scheduled time.</p>
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'View in Dashboard')}
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${employee.name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Has confirmado una nueva cita. Aquí están los detalles:</p>
    ${detailsBlock([
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
      ['Cliente', customerName],
      ['Teléfono', customerPhone],
      ['Correo', customerEmail],
    ])}
    ${customerNotes ? noteBlock('Notas del Cliente', customerNotes) : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">El cliente ha sido notificado y te verá a la hora programada.</p>
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'Ver en el Panel')}
  `;

  const emailSubjectEn = 'Appointment Confirmed — You\'ve Been Booked';
  const emailSubjectEs = 'Cita Confirmada — Has Sido Reservado';

  const emailHtmlEn = emailWrapper(bodyEn, 'en');
  const emailHtmlEs = emailWrapper(bodyEs, 'es');
  const emailHtmlBoth = emailWrapper(bodyEn + bilingualDivider + bodyEs, 'both');

  const subject = pref === 'es' ? emailSubjectEs : emailSubjectEn;
  const html = pref === 'en' ? emailHtmlEn : pref === 'es' ? emailHtmlEs : emailHtmlBoth;
  await sendEmail(employee.email, subject, html);
};

// ── Customer: Appointment Cancelled (by customer) ───────────────────

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

    const bodyEn = isPendingRequest
      ? `
      <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
      <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Your appointment request has been successfully cancelled:</p>
      ${detailsBlock([
        ['Service', service.name],
        ['Date', formattedDate],
        ['Time', formattedTime],
      ])}
      <p style="font-size:14px; color:#555; line-height:1.6;">We hope to see you again soon! You can book a new appointment anytime.</p>
      ${ctaButton(`${process.env.CLIENT_URL}`, 'Book Again')}
    ` : `
      <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
      <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Your confirmed appointment has been cancelled:</p>
      ${detailsBlock([
        ['Service', service.name],
        ['Date', formattedDate],
        ['Time', formattedTime],
      ])}
      <p style="font-size:14px; color:#555; line-height:1.6;">Your stylist has been notified of the cancellation. We hope to see you again soon!</p>
      ${ctaButton(`${process.env.CLIENT_URL}`, 'Book Again')}
    `;

    const bodyEs = isPendingRequest
      ? `
      <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
      <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Su solicitud de cita ha sido cancelada exitosamente:</p>
      ${detailsBlock([
        ['Servicio', service.name],
        ['Fecha', formatDateEs(date)],
        ['Hora', formattedTime],
      ])}
      <p style="font-size:14px; color:#555; line-height:1.6;">¡Esperamos verle pronto! Puede reservar una nueva cita cuando desee.</p>
      ${ctaButton(`${process.env.CLIENT_URL}`, 'Reservar de Nuevo')}
    ` : `
      <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
      <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Su cita confirmada ha sido cancelada:</p>
      ${detailsBlock([
        ['Servicio', service.name],
        ['Fecha', formatDateEs(date)],
        ['Hora', formattedTime],
      ])}
      <p style="font-size:14px; color:#555; line-height:1.6;">Su estilista ha sido notificado de la cancelación. ¡Esperamos verle pronto!</p>
      ${ctaButton(`${process.env.CLIENT_URL}`, 'Reservar de Nuevo')}
    `;

    const emailHtml = emailWrapper(isEs ? bodyEs : bodyEn, isEs ? 'es' : 'en');

    const smsMessage = isEs
      ? `${BRAND}: Su cita del ${formatDateEs(date)} a las ${formattedTime} ha sido cancelada. ¡Esperamos verle pronto!`
      : `${BRAND}: Your ${formattedDate} at ${formattedTime} appointment has been cancelled. Hope to see you again soon!`;

    if (appointment.notifyByEmail !== false) {
      await sendEmail(customerEmail, emailSubject, emailHtml);
    }
    if (appointment.notifyBySms !== false) {
      await sendSMS(customerPhone, smsMessage);
    }
  }
};

// ── Employee: Customer Cancelled ────────────────────────────────────

export const notifyEmployeeOfCancellation = async (appointment, service, employee) => {
  const { customerName, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const fullEmployee = await User.findByPk(employee.id, { attributes: ['emailLanguage', 'notificationSettings'] });
  const settings = fullEmployee?.notificationSettings || {};
  if (settings.cancellations === false) return;
  const pref = fullEmployee?.emailLanguage || 'both';
  if (pref === 'none') return;

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${employee.name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">A customer has cancelled their confirmed appointment with you:</p>
    ${detailsBlock([
      ['Customer', customerName],
      ['Phone', customerPhone],
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
    ])}
    <p style="font-size:14px; color:#555; line-height:1.6;">This time slot is now open for other appointments.</p>
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'Open Dashboard')}
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${employee.name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Un cliente ha cancelado su cita confirmada contigo:</p>
    ${detailsBlock([
      ['Cliente', customerName],
      ['Teléfono', customerPhone],
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
    ])}
    <p style="font-size:14px; color:#555; line-height:1.6;">Este horario ahora está disponible para otras citas.</p>
    ${ctaButton(`${process.env.CLIENT_URL}/employee-login`, 'Abrir Panel')}
  `;

  const emailSubjectEn = 'Appointment Cancelled by Customer';
  const emailSubjectEs = 'Cita Cancelada por el Cliente';

  const emailHtmlEn = emailWrapper(bodyEn, 'en');
  const emailHtmlEs = emailWrapper(bodyEs, 'es');
  const emailHtmlBoth = emailWrapper(bodyEn + bilingualDivider + bodyEs, 'both');

  const subject = pref === 'es' ? emailSubjectEs : emailSubjectEn;
  const html = pref === 'en' ? emailHtmlEn : pref === 'es' ? emailHtmlEs : emailHtmlBoth;
  await sendEmail(employee.email, subject, html);
};

// ── Customer: Employee Cancelled ────────────────────────────────────

export const notifyCustomerOfEmployeeCancellation = async (appointment, service, employee, reason) => {
  const { customerName, customerEmail, customerPhone, date, time, customerLanguage } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);
  const isEs = customerLanguage === 'es';

  const emailSubject = isEs ? 'Cita Cancelada' : 'Appointment Cancelled';

  const bodyEn = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">We regret to inform you that your appointment has been cancelled by your stylist, ${employee.name}:</p>
    ${detailsBlock([
      ['Service', service.name],
      ['Date', formattedDate],
      ['Time', formattedTime],
      ['Stylist', employee.name],
    ])}
    ${reason ? `<div style="margin:12px 0 20px; padding:12px 16px; background-color:#f8f9fa; border-left:3px solid #6c757d; border-radius:0 4px 4px 0;">
      <p style="margin:0 0 2px; font-size:12px; color:#888; font-weight:600;">Reason</p>
      <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">${reason}</p>
    </div>` : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">We sincerely apologize for the inconvenience. Please book another appointment or call us at <strong>${PHONE}</strong> to reschedule.</p>
    ${ctaButton(`${process.env.CLIENT_URL}`, 'Book Another Time')}
  `;

  const bodyEs = `
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${customerName},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 4px;">Lamentamos informarle que su cita ha sido cancelada por su estilista, ${employee.name}:</p>
    ${detailsBlock([
      ['Servicio', service.name],
      ['Fecha', formatDateEs(date)],
      ['Hora', formattedTime],
      ['Estilista', employee.name],
    ])}
    ${reason ? `<div style="margin:12px 0 20px; padding:12px 16px; background-color:#f8f9fa; border-left:3px solid #6c757d; border-radius:0 4px 4px 0;">
      <p style="margin:0 0 2px; font-size:12px; color:#888; font-weight:600;">Razón</p>
      <p style="margin:0; font-size:13px; color:#555; line-height:1.5;">${reason}</p>
    </div>` : ''}
    <p style="font-size:14px; color:#555; line-height:1.6;">Nos disculpamos sinceramente por el inconveniente. Reserve otra cita o llámenos al <strong>${PHONE}</strong> para reprogramar.</p>
    ${ctaButton(`${process.env.CLIENT_URL}`, 'Reservar Otro Horario')}
  `;

  const emailHtml = emailWrapper(isEs ? bodyEs : bodyEn, isEs ? 'es' : 'en');

  const smsMessage = isEs
    ? `${BRAND}: Su cita del ${formatDateEs(date)} a las ${formattedTime} ha sido cancelada por su estilista. Disculpe el inconveniente. Tel: ${PHONE}`
    : `${BRAND}: Your ${formattedDate} at ${formattedTime} appointment has been cancelled by your stylist. We apologize. Call ${PHONE} to reschedule.`;

  if (appointment.notifyByEmail !== false) {
    await sendEmail(customerEmail, emailSubject, emailHtml);
  }
  if (appointment.notifyBySms !== false) {
    await sendSMS(customerPhone, smsMessage);
  }
};

// ── Employee: Password Reset ────────────────────────────────────────

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const emailSubject = 'Password Reset / Restablecimiento de Contraseña';

  const bodyEn = `
    <p style="font-size:16px; color:${BRAND_COLOR}; font-weight:700; margin:0 0 16px;">Password Reset</p>
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hi ${name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 16px;">We received a request to reset the password for your employee account. Click the button below to create a new password:</p>
    ${ctaButton(resetUrl, 'Reset Password')}
    <p style="font-size:12px; color:#888; line-height:1.6; margin:0 0 4px;">Or copy this link: <a href="${resetUrl}" style="color:${ACCENT_COLOR}; word-break:break-all;">${resetUrl}</a></p>
    ${warningBlock('Link Expires in 1 Hour', 'If you didn\'t request this reset, you can safely ignore this email — your password will remain unchanged.')}
  `;

  const bodyEs = `
    <p style="font-size:16px; color:${BRAND_COLOR}; font-weight:700; margin:0 0 16px;">Restablecimiento de Contraseña</p>
    <p style="font-size:15px; color:#333; margin:0 0 16px;">Hola ${name},</p>
    <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 16px;">Recibimos una solicitud para restablecer la contraseña de su cuenta de empleado. Haga clic en el botón para crear una nueva contraseña:</p>
    ${ctaButton(resetUrl, 'Restablecer Contraseña')}
    <p style="font-size:12px; color:#888; line-height:1.6; margin:0 0 4px;">O copie este enlace: <a href="${resetUrl}" style="color:${ACCENT_COLOR}; word-break:break-all;">${resetUrl}</a></p>
    ${warningBlock('El enlace caduca en 1 hora', 'Si no solicitó este restablecimiento, puede ignorar este correo de forma segura — su contraseña no cambiará.')}
  `;

  const emailHtml = emailWrapper(bodyEn + bilingualDivider + bodyEs, 'both');
  await sendEmail(email, emailSubject, emailHtml);
};
