/**
 * JWT Configuration
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET_KEY || 'your-secret-key',
  expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Server Configuration
 */
export const serverConfig = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
