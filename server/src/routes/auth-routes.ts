import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize'; // Import Op directly
import User from '../models/user.js';

const router = express.Router();

// Sign-up
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user and ignore the returned value to avoid unused variable errors
    await User.create({ username, email, password: hashedPassword });

    return res.status(201).json({ message: 'Sign-up successful!' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(400).json({ error: 'Sign-up failed', details: errorMessage });
  }
});

// Log-in
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: 'Identifier (email or username) and password are required.' });
    }

    // Use Op.or to search by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ username: user.username, email: user.email }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });

    return res.json({ message: 'Log-in successful!', token });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ error: 'Log-in failed', details: errorMessage });
  }
});

export default router;