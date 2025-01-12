import express from 'express';
import authRoutes from './auth-routes';
import postRoutes from './post-routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);

export default router;