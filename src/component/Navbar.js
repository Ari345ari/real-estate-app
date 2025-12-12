import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const isAgent = user?.role === 'Agent' || user?.Role === 'Agent';

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div>
        <Link to={isAgent ? "/dashboard" : "/"} style={{ fontSize: '18px', fontWeight: 'bold' }}>
          ReEaalEstate
        </Link>
      </div>
      <div>
        {user ? (
          isAgent ? (
            <>
              <Link to="/dashboard">Listings</Link>
              <Link to="/bookings">Bookings</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/bookings">Bookings</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/rewards">Rewards</Link>
              <button onClick={handleLogout}>Logout</button>
            </>
          )
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