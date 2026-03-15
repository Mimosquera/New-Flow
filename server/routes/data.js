import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/data/employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { isEmployee: true },
      attributes: ['id', 'name', 'email'],
    });

    res.json({
      message: 'Employees retrieved successfully',
      data: employees,
      count: employees.length,
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: error.message || 'Failed to get employees' });
  }
});

export default router;
