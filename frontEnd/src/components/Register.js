import React, { useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import './Login.css'; // Reuse the login styles


function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/register`, {
        username,
        password,
      });
      setSuccess(response.data.message);
      setError(null);
      // Redirect to the login page (which is the default "/" route)
      setTimeout(() => {
        navigate('/');  // Change this to "/" to redirect to the default login page
      }, 2000);
    } catch (error) {
      setSuccess(null);
      if (error.response && error.response.status === 409) {
        setError('Username already exists. Try another.');
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  return (
    <div className="login-container">

      <nav className="navbar">
        <img src="/vt-logo.png" alt="Logo" className="navbar-logo" />
        <div className="nav-link">
          <Link to="/" className="home-link">Home</Link>
          <Link to="/about" className="about-link">About</Link>
        </div>
      </nav>

      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {error && <p style={{ color: 'white' }} >{error}</p>}
      {success && <p style={{ color: 'white' }} >{success}</p>}
    </div>
  );
}

export default Register;
