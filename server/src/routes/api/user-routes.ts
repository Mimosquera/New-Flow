import express from 'express';
import type { Request, Response } from 'express';
import { User } from '../../models/index.js';
import authenticateToken from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
const router = express.Router();

// POST /users - Create a new user (Sign-up)
router.post('/', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.create({ username, email, password });
    const secretKey = process.env.JWT_SECRET_KEY || '';

    const token = jwt.sign({ id: user.id, email }, secretKey, { expiresIn: '1h' });
    return res.json({ token });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// POST /login - User login (returns JWT token)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const secretKey = process.env.JWT_SECRET_KEY || '';
      const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '1h' });
      return res.json({ token });
    } else {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// GET /users - Get all users
router.get('/', authenticateToken,  async (_req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /users/:id - Get a user by id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /users - Create a new user
router.post('/', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    await User.create({ username, email, password });
    const secretKey = process.env.JWT_SECRET_KEY || '';

    const token = jwt.sign({ email }, secretKey, { expiresIn: '1h' });
    return res.json({ token });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
});

// PUT /users/:id - Update a user by id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, password } = req.body;
  try {
    const user = await User.findByPk(id);
    if (user) {
      user.username = username;
      user.password = password;
      await user.save();
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /users/:id - Delete a user by id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (user) {
      await user.destroy();
      res.json({ message: 'User deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export { router as userRouter };
