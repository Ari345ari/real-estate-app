import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Real Estate App</h1>
      <p>
        <Link to="/register">Register</Link> | <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Home;
