import express from 'express';
import { Update } from '../models/Update.js';
import { verifyToken } from '../middleware/auth.js';
import { requireEmployee, validateRequired, sanitizeString } from '../middleware/validation.js';
import { upload, cloudinary } from '../config/upload.js';

const router = express.Router();

// GET /api/updates
router.get('/', async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const options = {
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      attributes: ['id', 'title', 'content', 'author', 'date', 'media_url', 'media_type', 'user_id', 'createdAt', 'updatedAt'],
    };

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

function detectLanguage(text) {
  if (/[áéíóúñü¿¡]/i.test(text) || /\b(el|la|de|que|y|en|un|una|por|con|para|es)\b/i.test(text)) {
    return 'es';
  }
  return 'en';
}

// POST /api/updates
router.post('/', verifyToken, requireEmployee, upload.single('media'), validateRequired(['title', 'content']), async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const detectedLang = detectLanguage(`${title} ${content}`);

    const updateData = {
      title: sanitizeString(title),
      content: sanitizeString(content),
      author: author ? sanitizeString(author) : req.user.name || 'Employee',
      date: new Date().toISOString().split('T')[0],
      user_id: req.user.id,
      language: detectedLang,
    };

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'newflow-updates',
            resource_type: isVideo ? 'video' : 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      updateData.media_url = uploadResult.secure_url;
      updateData.media_type = isVideo ? 'video' : 'image';
      updateData.cloudinary_id = uploadResult.public_id;
    }

    const update = await Update.create(updateData);

    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating update:', error);
    res.status(500).json({ message: 'Failed to create update', error: error.message });
  }
});

// DELETE /api/updates/:id
router.delete('/:id', verifyToken, requireEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.email === process.env.SEED_EMPLOYEE_EMAIL;

    const update = await Update.findByPk(id);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    if (!isAdmin && update.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this update' });
    }

    if (update.cloudinary_id) {
      try {
        const resourceType = update.media_type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(update.cloudinary_id, { resource_type: resourceType });
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
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
