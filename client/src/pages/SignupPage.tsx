// src/LoginPage.jsx
import { useState } from 'react';
import auth from '../utils/auth';
import { signup } from '../api/authAPI';
// import type { UserSignup } from '../interfaces/UserSignup';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Dummy validation
    if (!email || !password || !username) {
      setErrorMessage('Please fill in all fields.');
    } else {
      setErrorMessage('');
      // Proceed with your login logic (e.g., API call)
      const newUser = {
        email: email,
        username: username,
        password: password
      }
      const data = await signup(newUser)
      auth.login(data.token);
      if (data) {
        console.log('success');
        
      }
      console.log('Logged in successfully');
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center login-page">
      <div className="card" style={{ width: '25rem' }}>
        <div className="card-body">
          <h3 className="card-title text-center">Signup</h3>
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
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              Signup
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;