// src/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import auth from '../utils/auth';
import { login } from '../api/authAPI';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState<string>(''); // Username or email
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!identifier || !password) {
      setErrorMessage('Please fill in both fields.');
      return;
    }

    try {
      const loginData = { identifier, password }; // Identifier can be username or email
      const data = await login(loginData);
      auth.login(data.token);
      navigate('/'); // Redirect to homepage
    } catch (err) {
      console.error('Failed to login:', err);
      setErrorMessage('Login failed. Please check your credentials.');
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
              <label htmlFor="identifier" className="form-label">
                Username or Email
              </label>
              <input
                type="text"
                className="form-control"
                id="identifier"
                placeholder="Enter username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
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
                placeholder="Enter password"
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