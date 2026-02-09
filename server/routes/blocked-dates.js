import express from 'express';
import { BlockedDate } from '../models/BlockedDate.js';
import { User } from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired } from '../middleware/validation.js';

const router = express.Router();

const isAdmin = (user) => user.email === process.env.SEED_EMPLOYEE_EMAIL;

// GET /api/blocked-dates
router.get('/', verifyToken, requireEmployee, async (req, res) => {
  try {
    const whereClause = {};

    if (!isAdmin(req.user)) {
      whereClause.userId = req.user.id;
    }

    const blockedDates = await BlockedDate.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
      }],
      order: [['date', 'ASC'], ['startTime', 'ASC']],
    });
    res.json({ data: blockedDates });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// POST /api/blocked-dates
router.post(
  '/',
  verifyToken,
  requireEmployee,
  validateRequired(['startDate', 'endDate', 'startTime', 'endTime']),
  async (req, res) => {
    try {
      const { startDate, endDate, startTime, endTime, reason } = req.body;
      const userId = req.user.id;

      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ error: 'End date must be on or after start date' });
      }

      if (startDate === endDate && startTime >= endTime) {
        return res.status(400).json({ error: 'End time must be after start time for same-day blocks' });
      }

      const dates = [];
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);

      while (currentDate <= lastDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const createdBlockedDates = [];
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        let blockStartTime, blockEndTime;

        if (dates.length === 1) {
          blockStartTime = startTime;
          blockEndTime = endTime;
        } else if (i === 0) {
          blockStartTime = startTime;
          blockEndTime = '23:59:59';
        } else if (i === dates.length - 1) {
          blockStartTime = '00:00:00';
          blockEndTime = endTime;
        } else {
          blockStartTime = '00:00:00';
          blockEndTime = '23:59:59';
        }

        const existingBlocked = await BlockedDate.findOne({
          where: {
            userId,
            date,
            startTime: blockStartTime,
            endTime: blockEndTime,
          },
        });

        if (!existingBlocked) {
          const blockedDate = await BlockedDate.create({
            date,
            startTime: blockStartTime,
            endTime: blockEndTime,
            reason: reason || null,
            userId,
          });

          const newBlockedDate = await BlockedDate.findByPk(blockedDate.id, {
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email'],
            }],
          });

          createdBlockedDates.push(newBlockedDate);
        }
      }

      if (createdBlockedDates.length === 0) {
        return res.status(400).json({
          error: 'All dates in this range are already blocked with the same time'
        });
      }

      res.status(201).json({
        message: `${createdBlockedDates.length} date(s) blocked successfully`,
        data: createdBlockedDates
      });
    } catch (error) {
      console.error('Error creating blocked dates:', error);
      res.status(500).json({ error: 'Failed to create blocked dates' });
    }
  }
);

// PUT /api/blocked-dates/:id
router.put(
  '/:id',
  verifyToken,
  requireEmployee,
  validateRequired(['date', 'startTime', 'endTime']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { date, startTime, endTime, reason } = req.body;

      const blockedDate = await BlockedDate.findByPk(id);

      if (!blockedDate) {
        return res.status(404).json({ error: 'Blocked date not found' });
      }

      if (!isAdmin(req.user) && blockedDate.userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to update this blocked date' });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      if (startTime >= endTime) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }

      await blockedDate.update({
        date,
        startTime,
        endTime,
        reason: reason || null,
      });

      const updatedBlockedDate = await BlockedDate.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        }],
      });

      res.json({
        message: 'Blocked date updated successfully',
        data: updatedBlockedDate
      });
    } catch (error) {
      console.error('Error updating blocked date:', error);
      res.status(500).json({ error: 'Failed to update blocked date' });
    }
  }
);

// DELETE /api/blocked-dates/:id
router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;

    const blockedDate = await BlockedDate.findByPk(id);

    if (!blockedDate) {
      return res.status(404).json({ error: 'Blocked date not found' });
    }

    if (!isAdmin(req.user) && blockedDate.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this blocked date' });
    }

    await blockedDate.destroy();
    res.json({ message: 'Blocked date deleted successfully' });
  } catch (error) {
    console.error('Error deleting blocked date:', error);
    res.status(500).json({ error: 'Failed to delete blocked date' });
  }
});

export default router;
