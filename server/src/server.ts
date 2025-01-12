const forceDatabaseRefresh = false;

import express from 'express';
import sequelize from './config/connection.js';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';

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

// Start OAuth flow
app.get('/auth', (_req, res) => {
  const clientId = process.env.CALENDLY_CLIENT_ID!;
  const redirectUri = process.env.CALENDLY_REDIRECT_URI!;
  const url = `https://calendly.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
  res.redirect(url);
});

// Callback route
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Authorization code is missing.');
  }

  const clientId = process.env.CALENDLY_CLIENT_ID!;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET!;
  const redirectUri = process.env.CALENDLY_REDIRECT_URI!;

  try {
    const response = await axios.post(
      'https://calendly.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = response.data;
    if (!access_token) {
      res.status(500).send('Access token not found.');
    }

    res.redirect(`${process.env.FRONTEND_URL}/appointments?access_token=${access_token}`);
  } catch (error: any) {
    res.status(500).send('Error during authentication.');
  }
});

// Fetch user data
app.get('/user-data', async (req, res) => {
  const { access_token } = req.query;

  if (!access_token) {
    return res.status(400).send('Access token is missing.');
  }

  try {
    const response = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    return res.json(response.data);
  } catch (error) {
    return res.status(500).send('Error fetching user data.');
  }
});

app.get('/event-types', async (req, res) => {
  const authHeader = req.headers.authorization;

  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(400).json({ error: 'Authorization token is missing or invalid.' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {

    const userResponse = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userUri = userResponse.data.resource.uri;
    console.log('User URI:', userUri);


    const response = await axios.get('https://api.calendly.com/event_types', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        user: userUri,
      },
    });

    console.log('Event Types:', response.data);

    return res.json(response.data);
  } catch (error: any) {
    console.error('Error fetching event types:', error.response?.data || error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || 'Internal Server Error';

    return res.status(statusCode).json({
      error: errorMessage,
    });
  }
});


// Define API routes
app.use(routes);

// Connect to database and start the server
sequelize.sync({ force: forceDatabaseRefresh }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
