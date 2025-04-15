import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_BACKEND_PORT}/login`, {
        username,
        password,
      });
      sessionStorage.setItem('token', response.data.token);
      navigate('/home'); // Redirect to the traffic visualizer page
    } catch (error) {
      console.error('Error logging in:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    }
  };

  return (
    <div className="login-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <img src ="/vt-logo.png" alt="Logo" className="navbar-logo" />
        <Link to="/" className="nav-link home-link">Home</Link>
        <Link to="/about" className="nav-link about-link">About</Link>
      </nav>

      <h2>Login</h2>
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
        <button type="submit">Login</button>
      </form>
      <div className="signUp" style={{ marginTop: '15px' }}>
        <p>Don't have an account? <Link to="/register">Sign up</Link></p>
      </div>
    </div>
  );
}

export default Login;