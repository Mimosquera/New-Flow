import jwt from 'jwt-simple';
import { jwtConfig } from '../config/constants.js';
import { User } from '../models/User.js';

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.decode(token, jwtConfig.secret);
    
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Please log in again.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}
