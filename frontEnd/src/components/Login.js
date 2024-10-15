import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

function Login(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Ensure this is used inside a Router context
  
  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}:3000/login`, {
        username,
        password,
      });
      // Save the token to sessionStorage
      sessionStorage.setItem('token', response.data.token);
      // Redirect to the home page
      navigate('/home');
    } catch (error) {
      console.error('Error logging in:', error);
      if(error.response.data.message){
        alert(error.response.data.message);
      }
    }
  };

  return (
    <div className="login-container">
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
      <div style={{ marginTop: '15px' }}>
        <p>Don't have an account? <Link to="/register">Sign up</Link></p> {/* Link to the register page */}
      </div>
    </div>
  );
}

export default Login;
