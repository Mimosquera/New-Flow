import express from 'express';
import { Update } from '../models/Update.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired, sanitizeString } from '../middleware/validation.js';
import { upload } from '../config/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * GET /api/updates
 * Get all updates with optional pagination
 * Public route - anyone can view updates
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;
    
    const options = {
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'author', 'date', 'media_url', 'media_type', 'user_id', 'createdAt', 'updatedAt'],
    };

    // Add pagination if limit is provided
    if (limit) {
      options.limit = parseInt(limit);
      if (offset) {
        options.offset = parseInt(offset);
      }
    }

    const updates = await Update.findAll(options);
    const totalCount = await Update.count();

    res.json({
      updates,
      total: totalCount,
      hasMore: offset ? (parseInt(offset) + updates.length) < totalCount : updates.length < totalCount
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    res.status(500).json({ message: 'Failed to fetch updates' });
  }
});

/**
 * POST /api/updates
 * Create a new update
 * Protected route - only authenticated employees can create updates
 */
router.post('/', verifyToken, requireEmployee, upload.single('media'), validateRequired(['title', 'content']), async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const updateData = {
      title: sanitizeString(title),
      content: sanitizeString(content),
      author: author ? sanitizeString(author) : req.user.name || 'Employee',
      date: new Date().toISOString().split('T')[0],
      user_id: req.user.id,
    };

    // Add media info if file was uploaded
    if (req.file) {
      updateData.media_url = `/uploads/${req.file.filename}`;
      // Determine media type from mimetype
      updateData.media_type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    }

    const update = await Update.create(updateData);

    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating update:', error);
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to create update' });
  }
});

/**
 * DELETE /api/updates/:id
 * Delete an update
 * Protected route - only authenticated employees can delete updates
 */
router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.email === process.env.SEED_EMPLOYEE_EMAIL;

    const update = await Update.findByPk(id);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Check permissions: admin can delete all, regular employees only their own
    if (!isAdmin && update.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this update' });
    }

    // Delete associated media file if it exists
    if (update.media_url) {
      const filepath = path.join(__dirname, '..', update.media_url);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await update.destroy();
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Error deleting update:', error);
    res.status(500).json({ message: 'Failed to delete update' });
  }
});

export default router;
