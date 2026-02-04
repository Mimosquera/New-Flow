import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { User } from '../models/User.js';

// Initialize email transporter
let emailTransporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Format time for display
 */
const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Send email notification
 */
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

/**
 * Send SMS notification
 */
const sendSMS = async (to, message) => {
  if (!twilioClient) {
    console.log('SMS service not configured. SMS would be sent to:', to);
    console.log('Message:', message);
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    // Format phone number for Twilio (must start with +1 for US)
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

/**
 * Send appointment request confirmation to customer
 */
export const sendAppointmentRequestConfirmation = async (appointment, service) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  // Email
  const emailSubject = 'Appointment Request Received';
  const emailHtml = `
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

  // SMS
  const smsMessage = `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your appointment request for ${service.name} on ${formattedDate} at ${formattedTime} has been received. We'll contact you shortly!`;

  await sendEmail(customerEmail, emailSubject, emailHtml);
  await sendSMS(customerPhone, smsMessage);
};

/**
 * Notify employees and business email about new appointment request
 */
export const notifyEmployeesOfNewAppointment = async (appointment, service, requestedEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  // Fetch all employees
  const employees = await User.findAll({
    where: { isEmployee: true },
    attributes: ['email', 'name'],
  });

  // Prepare email content
  const emailSubject = 'New Appointment Request';
  const emailHtml = `
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

  // Send to business email and all employees in parallel
  const emailPromises = [];
  
  // Business email
  if (process.env.EMAIL_USER) {
    emailPromises.push(sendEmail(process.env.EMAIL_USER, emailSubject, emailHtml));
  }
  
  // All employee emails
  employees.forEach(employee => {
    if (employee.email) {
      emailPromises.push(sendEmail(employee.email, emailSubject, emailHtml));
    }
  });

  await Promise.all(emailPromises);
};

/**
 * Send appointment accepted notification to customer
 */
export const sendAppointmentAcceptedNotification = async (appointment, service, acceptedByEmployee) => {
  const { customerName, customerEmail, customerPhone, date, time, employeeNote } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  // Email
  const emailSubject = 'Appointment Confirmed!';
  const emailHtml = `
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

  // SMS
  const smsMessage = `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your appointment on ${formattedDate} at ${formattedTime} is CONFIRMED with ${acceptedByEmployee.name}. See you soon!`;

  await sendEmail(customerEmail, emailSubject, emailHtml);
  await sendSMS(customerPhone, smsMessage);
};

/**
 * Send appointment declined notification to customer
 */
export const sendAppointmentDeclinedNotification = async (appointment, service, reason) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  // Email
  const emailSubject = 'Appointment Update';
  const emailHtml = `
    <h2>Appointment Update</h2>
    <p>Hi ${customerName},</p>
    <p>Unfortunately, we're unable to accommodate your requested appointment for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime}.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>Please feel free to request a different time slot, or call us at <strong>804-745-2525</strong> to find an alternative that works for you.</p>
    <p>We apologize for any inconvenience and hope to see you soon!</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  // SMS
  const smsMessage = `${process.env.BUSINESS_NAME || 'New Flow Salon'}: We're unable to confirm your ${formattedDate} ${formattedTime} appointment. Please call us or book another time. Sorry for the inconvenience!`;

  await sendEmail(customerEmail, emailSubject, emailHtml);
  await sendSMS(customerPhone, smsMessage);
};

/**
 * Notify employee that they have accepted an appointment
 */
export const notifyEmployeeOfAcceptedAppointment = async (appointment, service, employee) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const emailSubject = 'Appointment Confirmed - You\'ve Been Booked';
  const emailHtml = `
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

  await sendEmail(employee.email, emailSubject, emailHtml);
};
export const sendAppointmentCancelledNotification = async (appointment, service, cancelledBy = 'customer', wasPending = false) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  if (cancelledBy === 'customer') {
    // Check if appointment was pending (request) or accepted (confirmed)
    const isPendingRequest = wasPending;
    
    // Email to customer
    const emailSubject = isPendingRequest ? 'Appointment Request Cancelled' : 'Appointment Cancelled';
    const emailHtml = isPendingRequest 
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
    `;

    const smsMessage = `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your ${formattedDate} ${formattedTime} appointment has been cancelled. Hope to see you again soon!`;

    await sendEmail(customerEmail, emailSubject, emailHtml);
    await sendSMS(customerPhone, smsMessage);
  }

  // TODO: Notify employee if appointment was accepted
  // This would require passing employee info to this function
};

export const notifyEmployeeOfCancellation = async (appointment, service, employee) => {
  const { customerName, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const emailSubject = 'Appointment Cancelled by Customer';
  const emailHtml = `
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

  await sendEmail(employee.email, emailSubject, emailHtml);
};

export const notifyCustomerOfEmployeeCancellation = async (appointment, service, employee, reason) => {
  const { customerName, customerEmail, customerPhone, date, time } = appointment;
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const emailSubject = 'Appointment Cancelled';
  const emailHtml = `
    <h2>Appointment Cancelled</h2>
    <p>Hi ${customerName},</p>
    <p>We regret to inform you that your confirmed appointment for <strong>${service.name}</strong> on ${formattedDate} at ${formattedTime} has been cancelled by your barber/stylist, ${employee.name}.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p>We sincerely apologize for any inconvenience this may cause. Please feel free to book another appointment or call us at <strong>804-745-2525</strong> to reschedule.</p>
    <p>We look forward to serving you soon!</p>
    <p style="color: #666; font-size: 0.9em; margin-top: 20px;"><em>Please do not reply to this email as it is not monitored. For assistance, call us at 804-745-2525.</em></p>
    <p>- ${process.env.BUSINESS_NAME || 'New Flow Salon'}</p>
  `;

  const smsMessage = `${process.env.BUSINESS_NAME || 'New Flow Salon'}: Your ${formattedDate} ${formattedTime} appointment has been cancelled. We apologize for the inconvenience. Please call 804-745-2525 to reschedule.`;

  await sendEmail(customerEmail, emailSubject, emailHtml);
  await sendSMS(customerPhone, smsMessage);
};
