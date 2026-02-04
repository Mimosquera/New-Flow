/**
 * Appointments Routes Module
 * Handles all appointment-related API endpoints
 * 
 * Features:
 * - Create appointment requests
 * - Accept/Decline appointments by employees
 * - Cancel appointments (customer or employee)
 * - Filter appointments by status
 * - Role-based access control (admin vs regular employee)
 * - Automatic email/SMS notifications
 */

import express from 'express';
import { Op } from 'sequelize';
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { BlockedDate } from '../models/BlockedDate.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired } from '../middleware/validation.js';
import * as notificationService from '../services/notificationService.js';
import { isAppointmentUpcoming } from '../utils/dateUtils.js';

const router = express.Router();

// Constants
const STATUS_PENDING = 'pending';
const STATUS_ACCEPTED = 'accepted';
const STATUS_DECLINED = 'declined';
const STATUS_CANCELLED = 'cancelled';
const FILTER_UPCOMING = 'upcoming';

/**
 * Check if user is admin
 * @param {Object} user - User object with email
 * @returns {boolean} True if admin
 */
const isAdmin = (user) => {
  try {
    if (!user || !user.email) {
      return false;
    }
    return user.email === process.env.SEED_EMPLOYEE_EMAIL;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * GET /api/appointments
 * Get appointments filtered by employee role
 * Admin sees all appointments, regular employees see only relevant ones
 * @access Protected - Requires employee authentication
 */
router.get('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const userIsAdmin = isAdmin(req.user);
    const { filter } = req.query;

    let whereClause = {};

    // Build where clause based on user role
    if (userIsAdmin) {
      whereClause = {}; // Admin sees all appointments
    } else {
      // Regular employee: show pending (assigned to them or no preference) OR their accepted/declined/cancelled
      whereClause = {
        [Op.or]: [
          {
            status: STATUS_PENDING,
            [Op.or]: [
              { employeeId: userId },
              { employeeId: null },
            ],
          },
          {
            status: STATUS_ACCEPTED,
            acceptedByEmployeeId: userId,
          },
          {
            status: STATUS_DECLINED,
            acceptedByEmployeeId: userId,
          },
          {
            status: STATUS_CANCELLED,
            acceptedByEmployeeId: userId,
          },
        ],
      };
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: Service,
          as: 'service',
        },
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'acceptedBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Apply 'upcoming' filter if specified
    let filteredAppointments = appointments;
    if (filter === FILTER_UPCOMING) {
      filteredAppointments = appointments.filter(apt => {
        if (apt.status !== STATUS_ACCEPTED) return false;
        return isAppointmentUpcoming(apt.date, apt.time);
      });
    }

    res.json({ data: filteredAppointments || [] });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

/**
 * GET /api/appointments/public/:id
 * Get appointment details by ID without authentication
 * Used for customer cancellation page
 * @access Public
 */
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          model: Service,
          as: 'service',
        },
        {
          model: User,
          as: 'acceptedBy',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

/**
 * POST /api/appointments
 * Create a new appointment request
 * Sends notifications to customer and employees
 * @access Public
 */
router.post('/', validateRequired(['customerName', 'customerEmail', 'customerPhone', 'serviceId', 'date', 'time']), async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, serviceId, employeeId, date, time, customerNotes } = req.body;

    // Validate service exists
    const service = await Service.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Validate employee if provided
    let requestedEmployee = null;
    if (employeeId) {
      requestedEmployee = await User.findByPk(employeeId);
      if (!requestedEmployee) {
        return res.status(404).json({ error: 'Requested employee not found' });
      }
      
      // Check if the requested employee has blocked this date/time
      const blockedDate = await BlockedDate.findOne({
        where: {
          userId: employeeId,
          date: date,
          startTime: { [Op.lte]: time },
          endTime: { [Op.gt]: time },
        },
      });
      
      if (blockedDate) {
        return res.status(400).json({ 
          error: 'The requested employee is not available on this date/time. Please choose another time or employee.' 
        });
      }
    }

    const appointment = await Appointment.create({
      customerName,
      customerEmail,
      customerPhone,
      serviceId,
      employeeId: employeeId || null,
      date,
      time,
      status: STATUS_PENDING,
      customerNotes: customerNotes || null,
    });

    // Send notifications (non-blocking)
    Promise.all([
      notificationService.sendAppointmentRequestConfirmation(appointment, service),
      notificationService.notifyEmployeesOfNewAppointment(appointment, service, requestedEmployee)
    ]).catch(error => {
      console.error('Error sending appointment notifications:', error);
    });

    res.status(201).json({ data: appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

/**
 * PUT /api/appointments/:id/accept
 * Accept a pending appointment request
 * @access Protected - Requires employee authentication
 */
router.put('/:id/accept', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeNote } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const employeeId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status !== STATUS_PENDING) {
      return res.status(400).json({ error: 'Only pending appointments can be accepted' });
    }

    // Check if the employee has blocked this date/time
    const blockedDate = await BlockedDate.findOne({
      where: {
        userId: employeeId,
        date: appointment.date,
        startTime: { [Op.lte]: appointment.time },
        endTime: { [Op.gt]: appointment.time },
      },
    });
    
    if (blockedDate) {
      return res.status(400).json({ 
        error: 'You have blocked this date/time. Please unblock it first or decline this appointment.' 
      });
    }

    await appointment.update({
      status: STATUS_ACCEPTED,
      acceptedByEmployeeId: employeeId,
      employeeNote: employeeNote || null,
    });

    // Get related data for notifications
    const service = await Service.findByPk(appointment.serviceId);
    const acceptedByEmployee = await User.findByPk(employeeId);
    
    // Send notifications (non-blocking)
    if (service && acceptedByEmployee) {
      Promise.all([
        notificationService.sendAppointmentAcceptedNotification(appointment, service, acceptedByEmployee),
        notificationService.notifyEmployeeOfAcceptedAppointment(appointment, service, acceptedByEmployee)
      ]).catch(error => {
        console.error('Error sending accept notifications:', error);
      });
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error accepting appointment:', error);
    res.status(500).json({ error: 'Failed to accept appointment' });
  }
});

/**
 * PUT /api/appointments/:id/decline
 * Decline a pending appointment request
 * @access Protected - Requires employee authentication
 */
router.put('/:id/decline', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeNote } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const employeeId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    if (!employeeNote || !employeeNote.trim()) {
      return res.status(400).json({ error: 'Reason for decline is required' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status !== STATUS_PENDING) {
      return res.status(400).json({ error: 'Only pending appointments can be declined' });
    }

    // Only assigned employee can decline, or any employee if no preference
    if (appointment.employeeId && appointment.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Not authorized to decline this appointment' });
    }

    await appointment.update({
      status: STATUS_DECLINED,
      acceptedByEmployeeId: employeeId,
      employeeNote: employeeNote,
    });

    // Send notification to customer
    const service = await Service.findByPk(appointment.serviceId);
    if (service) {
      notificationService.sendAppointmentDeclinedNotification(appointment, service, employeeNote)
        .catch(error => console.error('Error sending decline notification:', error));
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error declining appointment:', error);
    res.status(500).json({ error: 'Failed to decline appointment' });
  }
});

/**
 * PUT /api/appointments/:id/cancel
 * Cancel an appointment (customer-initiated)
 * @access Public - No authentication required
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === STATUS_CANCELLED) {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    const wasPending = appointment.status === STATUS_PENDING;

    await appointment.update({
      status: STATUS_CANCELLED,
    });

    // Send notifications
    const service = await Service.findByPk(appointment.serviceId);
    if (service) {
      // Notify customer
      notificationService.sendAppointmentCancelledNotification(appointment, service, 'customer', wasPending)
        .catch(error => console.error('Error sending cancellation notification:', error));
      
      // Notify employee if appointment was accepted
      if (!wasPending && appointment.acceptedByEmployeeId) {
        const employee = await User.findByPk(appointment.acceptedByEmployeeId);
        if (employee) {
          notificationService.notifyEmployeeOfCancellation(appointment, service, employee)
            .catch(error => console.error('Error notifying employee:', error));
        }
      }
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

/**
 * PUT /api/appointments/:id/cancel-by-employee
 * Cancel an accepted appointment (employee-initiated)
 * @access Protected - Requires employee authentication
 */
router.put('/:id/cancel-by-employee', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === STATUS_CANCELLED) {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status !== STATUS_ACCEPTED) {
      return res.status(400).json({ error: 'Only accepted appointments can be cancelled by employees' });
    }

    // Verify authorization
    const userIsAdmin = isAdmin(req.user);
    if (!userIsAdmin && appointment.acceptedByEmployeeId !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel appointments you accepted' });
    }

    await appointment.update({
      status: STATUS_CANCELLED,
    });

    // Notify customer
    const service = await Service.findByPk(appointment.serviceId);
    const employee = await User.findByPk(appointment.acceptedByEmployeeId);
    
    if (service && employee) {
      notificationService.notifyCustomerOfEmployeeCancellation(appointment, service, employee, reason)
        .catch(error => console.error('Error sending cancellation notification:', error));
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

export default router;
