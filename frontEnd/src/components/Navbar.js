// frontEnd/src/components/Navbar.js

import React from 'react';
import './Navbar.css';

function Navbar({ username, onLogout }) {
  return (
    <div className="navbar">
      <div className="navbar-title">Traffic Visualizer</div>
      <div className="navbar-user">
        {username} | <button onClick={onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

export default Navbar;
