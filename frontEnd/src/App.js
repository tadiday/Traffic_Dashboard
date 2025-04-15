import React from 'react';
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Main from './components/Main';
import Register from './components/Register';
import About from './components/About';

function App() {
  const location = useLocation(); // Get the current route

  // Define routes where the navbar should NOT appear
  const hideNavbarRoutes = ['/home', '/register', '/about'];
  
  return (
    <>
      {/* Conditionally render the navigation bar only on routes not in hideNavbarRoutes */}
      {!hideNavbarRoutes.includes(location.pathname) && (
        <nav className="navbar">
          <a href="/" className="nav-link home-link">Home</a>
          <a href="/about" className="nav-link about-link">About</a>
        </nav>
      )}

      <Routes>
        <Route path="/home" element={<ProtectedRoute><Main /></ProtectedRoute>} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
} 