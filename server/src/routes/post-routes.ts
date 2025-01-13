import express from 'express';
import authenticate from '../middleware/auth.js';
import Post from '../models/post.js';

const router = express.Router();

// Get all posts
router.get('/', async (_req, res) => {
  try {
    const posts = await Post.findAll();
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
});

// Create a post
router.post('/', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = (req.user as { id: number }).id;

    if (!userId) {
      return res.status(401).json({ error: 'User not logged in.' });
    }

    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const post = await Post.create({ content, userId });
    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

export default router;