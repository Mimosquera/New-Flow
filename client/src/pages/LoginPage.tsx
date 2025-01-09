// src/LoginPage.jsx
import { useState } from 'react';
import Auth from '../utils/auth';
import { login } from '../api/authAPI';
// import type { UserLogin } from '../interfaces/UserLogin';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async(e) => {
    e.preventDefault();

    // Dummy validation
    if (!email || !password) {
      setErrorMessage('Please fill in both fields.');
    } else {
      setErrorMessage('');
      // Proceed with your login logic (e.g., API call)
      try {
        const loginData = {
          email: email,
          password: password
        }
        const data = await login(loginData);
        Auth.login(data.token);
      } catch (err) {
        console.error('Failed to login', err);
      }
      console.log('Logged in successfully');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center login-page">
      <div className="card" style={{ width: '25rem' }}>
        <div className="card-body">
          <h3 className="card-title text-center">Login</h3>
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
