import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'authToken';
const MILLISECONDS_PER_SECOND = 1000;

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (!token) return false;
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    
    if (!decoded || typeof decoded.exp !== 'number') {
      return false;
    }

    const expirationTime = decoded.exp * MILLISECONDS_PER_SECOND;
    const currentTime = Date.now();
    
    return expirationTime > currentTime;
  } catch (error) {
    return false;
  }
};

export const decodeToken = (token) => {
  if (!token) return null;

  try {
    return jwtDecode(token) || null;
  } catch (error) {
    return null;
  }
};

export const getUserIdFromToken = () => {
  try {
    const token = getToken();
    if (!token) return null;

    const decoded = decodeToken(token);
    return decoded?.id || decoded?.userId || null;
  } catch (error) {
    return null;
  }
};

export const isAuthenticated = () => {
  try {
    const token = getToken();
    return isTokenValid(token);
  } catch (error) {
    return false;
  }
};
