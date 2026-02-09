import express from 'express';
import { verifyToken } from '../middleware/auth.js';
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

// GET /api/data
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
    });

    res.json({
      message: 'Users retrieved successfully',
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ message: error.message || 'Failed to get data' });
  }
});

// GET /api/data/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
});

export default router;
