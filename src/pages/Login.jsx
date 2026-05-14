import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_USERNAME = 'user';
const DEFAULT_PASSWORD = 'admin';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      localStorage.setItem('bb-admin-token', 'authenticated');
      navigate('/tournaments');
      return;
    }

    setError('Invalid credentials. Use username "user" and password "admin".');
  }

  return (
    <div className="page-container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h1>Admin Login</h1>
        <p className="page-notice">
          Login with default credentials to manage tournaments and update live ball badminton scores.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="user"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit">Sign In</button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}
