import express from 'express';
import { User } from '../../models/index.js';
import authenticateToken from '../../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// POST /users - Create a new user (Sign-up)
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;
  console.log ('Here is req.body',req.body)
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user= await User.create({ username, email, password: hashedPassword });
    console.log('This is the user', user)
    res.status(201).json({ message: 'User created successfully.' });
  } catch (error: any) {
    console.log ('here is the error', error)
    res.status(400).json({ message: error.message });
  }
});

// GET /users - Get all users
router.get('/', authenticateToken, async (_req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as userRouter };