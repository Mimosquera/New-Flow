import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth'; // Ensure correct import path
import { Post } from '../models/post'; // Assuming you have a Post model defined


const router = express.Router();

// Extending Request type to include user (from the authentication middleware)
declare global {
  namespace Express {
    interface Request {
      user?: { username: string; } | undefined; // This must match the updated structure from JWT payload
    }
  }
}

// POST /posts - Create a new post (Only accessible to logged-in users)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const userId = req.user; // Now `id` is available on `req.user`

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const newPost = await Post.create({ title, content, });
    return res.status(201).json({ message: 'Post created successfully!', post: newPost });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});
  

// GET /posts - Get all posts (Accessible to everyone)
router.get('/', async (res: Response) => { // Removed `req`
  try {
    const posts = await Post.findAll(); // Assuming you're using Sequelize ORM
    return res.json(posts); // Make sure to return the response
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;