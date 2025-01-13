import type { UserLogin } from '../interfaces/UserLogin';
import type { UserSignup } from '../interfaces/UserSignup';

const login = async (userInfo: UserLogin) => {
  try {
    const baseUrl = (import.meta as any).env.VITE_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('User information not retrieved, check network tab!');
    }

    return data;
  } catch (err) {
    console.log('Error from user login: ', err);
    return Promise.reject('Could not fetch user info');
  }
};

const signup = async (userInfo: UserSignup) => {
  try {
    const baseUrl = (import.meta as any).env.VITE_BASE_URL || "http://localhost:3001";
    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInfo),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error('User information not retrieved, check network tab!');
    }

    return data;
  } catch (err) {
    console.log('Error from user signup: ', err);
    return Promise.reject('Could not fetch user info');
  }
};

export { login, signup };