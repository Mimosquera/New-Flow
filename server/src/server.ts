const forceDatabaseRefresh = false;

import express from 'express';
import sequelize from './config/connection.js';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Use Helmet for enhanced security
app.use(helmet());

// Add CORS for cross-origin resource sharing
app.use(cors());

// Content Security Policy (CSP) to secure iframes and other content
// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "frame-ancestors 'self'; default-src 'self'; frame-src 'https://www.google.com';"
//   );
//   next();
// });

// Serves static files in the client's dist folder
app.use(express.static('../client/dist'));

// Middleware for parsing JSON request bodies
app.use(express.json());

// Add rate limiting to prevent abuse (optional but recommended)
// import rateLimit from 'express-rate-limit';

// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // Limit each IP to 100 requests per `window` (15 minutes)
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// // Apply the rate limiter to API routes
// app.use('/api', apiLimiter);


// Define API routes
app.use(routes);

// Connect to database and start the server
sequelize.sync({ force: forceDatabaseRefresh }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
