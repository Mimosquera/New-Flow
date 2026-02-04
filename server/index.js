import 'dotenv/config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize } from './config/database.js';
import { serverConfig } from './config/constants.js';
import './models/User.js';
import './models/Update.js';
import './models/Service.js';
import './models/Availability.js';
import './models/Appointment.js';
import './models/BlockedDate.js';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import updateRoutes from './routes/updates.js';
import serviceRoutes from './routes/services.js';
import availabilityRoutes from './routes/availability.js';
import appointmentRoutes from './routes/appointments.js';
import blockedDatesRoutes from './routes/blocked-dates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware with stricter settings
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: serverConfig.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/blocked-dates', blockedDatesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(serverConfig.nodeEnv === 'development' && { error: err })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established');

    // Sync models
    await sequelize.sync({ alter: false });
    console.log('Database synced');

    // Start server
    app.listen(serverConfig.port, () => {
      console.log(`Server running on http://localhost:${serverConfig.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
