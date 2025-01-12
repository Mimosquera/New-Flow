// src/SignupPage.tsx
import { useState } from 'react';
import auth from '../utils/auth';
import { signup } from '../api/authAPI';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Dummy validation
    if (!email || !password || !username) {
      setErrorMessage('Please fill in all fields.');
    } else {
      setErrorMessage('');
      // Proceed with your signup logic (e.g., API call)
      try {
        const newUser = {
          email: email,
          username: username,
          password: password,
        };
        const data = await signup(newUser);
        auth.login(data.token);
        if (data) {
          console.log('Signup successful');
        }
      } catch (err) {
        console.error('Failed to signup', err);
        setErrorMessage('Signup failed. Please try again.');
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