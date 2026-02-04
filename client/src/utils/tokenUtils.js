/**
 * Token Utilities Module
 * Handles JWT token storage, validation, and decoding for authentication
 */

import { jwtDecode } from 'jwt-decode';

// Constants
const TOKEN_KEY = 'authToken';
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Get authentication token from localStorage
 * @returns {string|null} Authentication token or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token from localStorage:', error);
    return null;
  }
};

/**
 * Save authentication token to localStorage
 * @param {string} token - JWT token to save
 * @returns {boolean} True if saved successfully, false otherwise
 */
export const setToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token provided to setToken');
      return false;
    }
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
    return false;
  }
};

/**
 * Remove authentication token from localStorage
 * @returns {boolean} True if removed successfully, false otherwise
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
    return false;
  }
};

/**
 * Check if token is valid and not expired
 * @param {string} token - JWT token to validate
 * @returns {boolean} True if token is valid and not expired, false otherwise
 */
export const isTokenValid = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    const decoded = jwtDecode(token);
    
    if (!decoded || typeof decoded.exp !== 'number') {
      return false;
    }

    const expirationTime = decoded.exp * MILLISECONDS_PER_SECOND;
    const currentTime = Date.now();
    
    return expirationTime > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Decode JWT token and extract user data
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const decodeToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwtDecode(token);
    return decoded || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Get user ID from stored token
 * @returns {string|null} User ID or null if not available
 */
export const getUserIdFromToken = () => {
  try {
    const token = getToken();
    if (!token) return null;

    const decoded = decodeToken(token);
    return decoded?.id || decoded?.userId || null;
  } catch (error) {
    console.error('Error getting user ID from token:', error);
    return null;
  }
};

/**
 * Check if current user is authenticated
 * @returns {boolean} True if user has valid token, false otherwise
 */
export const isAuthenticated = () => {
  try {
    const token = getToken();
    return isTokenValid(token);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};
