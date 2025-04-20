import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import './About.css';


function About() {
  return (
    <div className="about-container">

      <nav className="navbar">
        <img src="/vt-logo.png" alt="Logo" className="navbar-logo" />
        <div className="nav-link">
          <Link to="/" className="home-link">Home</Link>
          <Link to="/about" className="about-link">About</Link>
        </div>
      </nav>

      <div className="about-box">
        <h1>About the Simulation</h1>
        <p>
          The Traffic Simulation Dashboard is designed to provide real-time insights into traffic patterns and congestion management.
          It helps users analyze traffic data, predict congestion, and make informed decisions to improve traffic flow.
        </p>
        <p>
          This simulation is particularly beneficial for the college by optimizing campus traffic, reducing delays, and enhancing safety for students and staff.
          It also serves as a learning tool for students studying traffic engineering and data analysis.
        </p>
      </div>
      <div className="about-image">
        <img src="/about-bgrd.png" alt="Traffic Simulation" />
      </div>
    </div>
  );
}

export default About;