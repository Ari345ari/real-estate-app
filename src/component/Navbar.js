import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div>
        <Link to="/" style={{ fontSize: '18px', fontWeight: 'bold' }}>🏠 RealEstate</Link>
      </div>
      <div>
        {user ? (
          <>
            <Link to="/search">Search</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/bookings">Bookings</Link>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} style={{ marginLeft: '20px', padding: '8px 15px' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;