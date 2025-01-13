import express from 'express';
import cors from 'cors'; // Import the cors package
import authRoutes from './auth-routes.js';
import { userRouter } from './api/user-routes.js';
import postRoutes from './post-routes.js';

const app = express(); // Use app instead of router here to set up middleware

// Enable CORS globally (for all routes)
app.use(cors()); // Allow all domains, or you can configure specific domains if needed

// Middleware to parse JSON bodies
app.use(express.json());

// Use your routes after setting up middleware
app.use('/auth', authRoutes);
app.use('/users', userRouter);
app.use('/posts', postRoutes);

export default app; // Export app instead of router