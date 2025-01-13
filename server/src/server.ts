const forceDatabaseRefresh = false;
import path from 'path';
import express from 'express';
import sequelize from './config/connection.js';
import routes from './routes/index.js';
import cors from 'cors';
import helmet from 'helmet';
import axios, { AxiosError } from 'axios';
import { fileURLToPath } from 'url'; // Recreate __dirname in ES module

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use Helmet for enhanced security
app.use(helmet());

// Add CORS for cross-origin resource sharing
app.use(cors());

// Serves static files in the client's dist folder
app.use(express.static('../client/dist'));

const distPath = path.resolve(__dirname, '../client/dist');
app.get('/', (_req, res) => { res.sendFile(path.resolve(distPath, 'index.html')); });

// Middleware for parsing JSON request bodies
app.use(express.json());

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

  if (!code || typeof code !== 'string') {
    return res.status(400).send('Authorization code is missing or invalid.');
  }

  const clientId = process.env.CALENDLY_CLIENT_ID!;
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET!;
  const redirectUri = process.env.CALENDLY_REDIRECT_URI!;

  try {
    const response = await axios.post(
      'https://calendly.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri || '', // Ensure that it's a valid string
        client_id: clientId || '', // Ensure that it's a valid string
        client_secret: clientSecret || '', // Ensure that it's a valid string
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = response.data;
    if (!access_token) {
      return res.status(500).send('Access token not found.');
    }

    return res.redirect(`${process.env.FRONTEND_URL}/appointments?access_token=${access_token}`);
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const message = error.response?.data || 'Error during authentication.';
      const status = error.response?.status || 500;
      return res.status(status).send(message);
    }
    return res.status(500).send('Unexpected error during authentication.');
  }
});

// Fetch user data
app.get('/user-data', async (req, res) => {
  const { access_token } = req.query;

  if (!access_token || typeof access_token !== 'string') {
    return res.status(400).send('Access token is missing or invalid.');
  }

  try {
    const response = await axios.get('https://api.calendly.com/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    return res.json(response.data);
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const message = error.response?.data || 'Error fetching user data.';
      const status = error.response?.status || 500;
      return res.status(status).send(message);
    }
    return res.status(500).send('Unexpected error fetching user data.');
  }
});

// Fetch event types
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
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data || 'Internal Server Error';

      console.error('Error fetching event types:', message);

      return res.status(status).json({
        error: message,
      });
    }
    return res.status(500).json({
      error: 'Unexpected error fetching event types.',
    });
  }
});

// Define API routes
app.use(routes);

// Connect to database and start the server
sequelize.sync({ force: forceDatabaseRefresh}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});

// Type guard to check if error is an AxiosError
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}