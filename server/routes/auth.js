import express from 'express';
import jwt from 'jwt-simple';
import { User } from '../models/User.js';
import { jwtConfig } from '../config/constants.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper function to create JWT token
 */
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

/**
 * Register endpoint
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Trim and sanitize inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create user
    const user = await User.create({ 
      name: trimmedName, 
      email: trimmedEmail, 
      password 
    });

    // Create token
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

/**
 * Login endpoint
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Sanitize email
    const trimmedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
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

/**
 * Employee Login endpoint
 * POST /api/auth/employee-login
 */
router.post('/employee-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Sanitize email
    const trimmedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is an employee
    if (!user.isEmployee) {
      return res.status(403).json({ message: 'Employee access only' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create token
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

/**
 * Verify endpoint (check token validity)
 * GET /api/auth/verify
 */
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

/**
 * Get current user
 * GET /api/auth/me
 */
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

export default router;
