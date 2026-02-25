import express from 'express';
import jwt from 'jwt-simple';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User } from '../models/User.js';
import { jwtConfig } from '../config/constants.js';
import { verifyToken } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/notificationService.js';

const router = express.Router();

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    isEmployee: user.isEmployee,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + jwtConfig.expiresIn,
  };
  return jwt.encode(payload, jwtConfig.secret);
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password
    });

    const token = createToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Login failed' });
  }
});

// POST /api/auth/employee-login
router.post('/employee-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmployee) {
      return res.status(403).json({ message: 'Employee access only' });
    }

    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = createToken(user);

    res.json({
      message: 'Employee login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ message: error.message || 'Employee login failed' });
  }
});

// GET /api/auth/verify
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Token is valid',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: error.message || 'Verification failed' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: error.message || 'Failed to get user' });
  }
});

// POST /api/auth/create-employee
router.post('/create-employee', verifyToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const requestingUser = await User.findByPk(req.user.id);
    const adminEmail = process.env.SEED_EMPLOYEE_EMAIL;
    if (!requestingUser || !adminEmail || requestingUser.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password,
      isEmployee: true
    });

    res.status(201).json({
      message: 'Employee account created successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: error.message || 'Failed to create employee account' });
  }
});

// GET /api/auth/employees
router.get('/employees', verifyToken, async (req, res) => {
  try {
    const requestingUser = await User.findByPk(req.user.id);
    const adminEmail = process.env.SEED_EMPLOYEE_EMAIL;
    if (!requestingUser || !adminEmail || requestingUser.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const employees = await User.findAll({
      where: { isEmployee: true },
      attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
      order: [['name', 'ASC']]
    });

    res.json({ data: employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch employees' });
  }
});

// PUT /api/auth/update-employee-password
router.put('/update-employee-password', verifyToken, async (req, res) => {
  try {
    const { employeeId, newPassword, adminPassword } = req.body;

    if (!employeeId || !newPassword || !adminPassword) {
      return res.status(400).json({ message: 'Employee ID, new password, and admin password are required' });
    }

    const requestingUser = await User.findByPk(req.user.id);
    const adminEmail = process.env.SEED_EMPLOYEE_EMAIL;
    if (!requestingUser || !adminEmail || requestingUser.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const isValidAdminPassword = await requestingUser.verifyPassword(adminPassword);
    if (!isValidAdminPassword) {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const employee = await User.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.isEmployee) {
      return res.status(400).json({ message: 'User is not an employee' });
    }

    await employee.update({ password: newPassword });

    res.json({
      message: 'Employee password updated successfully',
      user: employee.toJSON()
    });
  } catch (error) {
    console.error('Update employee password error:', error);
    res.status(500).json({ message: error.message || 'Failed to update employee password' });
  }
});

// DELETE /api/auth/employee/:id
router.delete('/employee/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ message: 'Admin password is required' });
    }

    const requestingUser = await User.findByPk(req.user.id);
    const adminEmail = process.env.SEED_EMPLOYEE_EMAIL;
    if (!requestingUser || !adminEmail || requestingUser.email !== adminEmail) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const isValidAdminPassword = await requestingUser.verifyPassword(adminPassword);
    if (!isValidAdminPassword) {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    const employee = await User.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!employee.isEmployee) {
      return res.status(400).json({ message: 'User is not an employee' });
    }

    if (adminEmail && employee.email === adminEmail) {
      return res.status(403).json({ message: 'Cannot delete the Admin account' });
    }

    await employee.destroy();

    res.json({
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete employee' });
  }
});

// GET /api/auth/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isEmployee: user.isEmployee
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

// PUT /api/auth/profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const isValidPassword = await user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    if (name && name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      const existingUser = await User.findOne({
        where: {
          email: email.trim().toLowerCase(),
          id: { [Op.ne]: req.user.id }
        }
      });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
    }

    if (newPassword && newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (newPassword) updateData.password = newPassword;

    await user.update(updateData);

    const newToken = createToken(user);

    res.json({
      message: 'Profile updated successfully',
      token: newToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: trimmedEmail } });

    if (!user) {
      return res.json({
        message: 'If that email exists, a reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000)
    });

    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({
      message: 'If that email exists, a reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    await user.update({
      password: newPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// GET /api/auth/verify-reset-token/:token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() }
      }
    });

    res.json({ valid: !!user });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ valid: false });
  }
});

export default router;
