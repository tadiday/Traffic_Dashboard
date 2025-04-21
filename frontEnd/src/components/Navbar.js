// frontEnd/src/components/Navbar.js

import React from 'react';
import './Navbar.css';

function Navbar(props) {
  return (
    <div className="navbar-inside">
      <div className="navbar-title">Traffic Visualizer</div>
      <div className="navbar-user">
        {props.username} | <button onClick={props.onLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
}

export default Navbar;
