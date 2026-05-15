import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setErrorMessage('');

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(result.message);
    }

    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>UOG</h1>
        <h2>Student Health Referral System</h2>
        <p className="login-subtitle">Clinic to Hospital Referral Platform</p>

        {errorMessage && <div className="error-box">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;