import express from 'express';
import { Availability } from '../models/Availability.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { BlockedDate } from '../models/BlockedDate.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired } from '../middleware/validation.js';

const router = express.Router();

const isAdmin = (user) => user.email === process.env.SEED_EMPLOYEE_EMAIL;

// GET /api/availability
router.get('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const whereClause = {};

    if (!isAdmin(req.user)) {
      whereClause.userId = req.user.id;
    }
    
    const availabilities = await Availability.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']],
    });
    res.json({ data: availabilities });
  } catch (error) {
    console.error('Error fetching availabilities:', error);
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
});

// GET /api/availability/day/:dayOfWeek
router.get('/day/:dayOfWeek', async (req, res) => {
  try {
    const { dayOfWeek } = req.params;
    const availabilities = await Availability.findAll({
      where: { dayOfWeek: parseInt(dayOfWeek) },
      order: [['startTime', 'ASC']],
    });
    res.json({ data: availabilities });
  } catch (error) {
    console.error('Error fetching availabilities for day:', error);
    res.status(500).json({ error: 'Failed to fetch availabilities' });
  }
});

// GET /api/availability/available-times/:date
router.get('/available-times/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { employeeId } = req.query;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }
    const dayOfWeek = dateObj.getDay();

    const availabilityWhere = { dayOfWeek };
    if (employeeId) {
      availabilityWhere.userId = employeeId;
    }

    const availabilities = await Availability.findAll({
      where: availabilityWhere,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name'],
      }],
    });
    
    if (availabilities.length === 0) {
      return res.json({ data: [] });
    }

    // Blocked dates take priority over recurring availability
    const blockedDates = await BlockedDate.findAll({
      where: { date },
      attributes: ['userId', 'startTime', 'endTime'],
    });

    const blockedEmployeesByTime = {};
    blockedDates.forEach(blocked => {
      const blockedUserId = blocked.userId;
      const blockedStart = blocked.startTime;
      const blockedEnd = blocked.endTime;

      let current = blockedStart;
      while (current < blockedEnd) {
        if (!blockedEmployeesByTime[current]) {
          blockedEmployeesByTime[current] = new Set();
        }
        blockedEmployeesByTime[current].add(blockedUserId);

        const [hours, minutes] = current.split(':');
        let newMinutes = parseInt(minutes) + 30;
        let newHours = parseInt(hours);
        if (newMinutes >= 60) {
          newMinutes -= 60;
          newHours += 1;
        }
        current = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
      }
    });

    const acceptedAppointments = await Appointment.findAll({
      where: {
        date,
        status: 'accepted',
      },
      attributes: ['time', 'acceptedByEmployeeId'],
    });

    const acceptedByEmployeeAtTime = {};
    acceptedAppointments.forEach(apt => {
      if (!acceptedByEmployeeAtTime[apt.time]) {
        acceptedByEmployeeAtTime[apt.time] = new Set();
      }
      acceptedByEmployeeAtTime[apt.time].add(apt.acceptedByEmployeeId);
    });

    const timeSlots = new Set();
    const employeesByTime = {};

    availabilities.forEach(avail => {
      const startTime = avail.startTime;
      const endTime = avail.endTime;

      let current = startTime;
      while (current < endTime) {
        timeSlots.add(current);
        
        if (!employeesByTime[current]) {
          employeesByTime[current] = new Set();
        }
        employeesByTime[current].add(avail.userId);

        const [hours, minutes] = current.split(':');
        let newMinutes = parseInt(minutes) + 30;
        let newHours = parseInt(hours);
        if (newMinutes >= 60) {
          newMinutes -= 60;
          newHours += 1;
        }
        current = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}:00`;
      }
    });

    const availableTimeSlots = Array.from(timeSlots).filter(time => {
      const availableEmployees = employeesByTime[time];
      const acceptedEmployees = acceptedByEmployeeAtTime[time] || new Set();
      const blockedEmployees = blockedEmployeesByTime[time] || new Set();

      for (const empId of availableEmployees) {
        if (!acceptedEmployees.has(empId) && !blockedEmployees.has(empId)) {
          return true;
        }
      }
      return false;
    });

    availableTimeSlots.sort();

    res.json({ data: availableTimeSlots });
  } catch (error) {
    console.error('Error fetching available times:', error);
    res.status(500).json({ error: 'Failed to fetch available times' });
  }
});

// POST /api/availability
router.post('/', verifyToken, requireEmployee, validateRequired(['dayOfWeek', 'startTime', 'endTime']), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const availability = await Availability.create({
      dayOfWeek,
      startTime,
      endTime,
      userId,
    });

    res.status(201).json({ data: availability });
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ error: 'Failed to create availability' });
  }
});

// PUT /api/availability/:id
router.put('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime } = req.body;
    const userId = req.user.id;

    const availability = await Availability.findByPk(id);

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    if (!isAdmin(req.user) && availability.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this availability' });
    }

    if (startTime && endTime && startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    await availability.update({
      startTime: startTime || availability.startTime,
      endTime: endTime || availability.endTime,
    });

    res.json({ data: availability });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// DELETE /api/availability/:id
router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const availability = await Availability.findByPk(id);

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    if (!isAdmin(req.user) && availability.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this availability' });
    }

    await availability.destroy();
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
});

export default router;
