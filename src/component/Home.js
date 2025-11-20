import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        padding: '80px 20px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Find Your Perfect Home</h1>
        <p style={{ fontSize: '20px', marginBottom: '30px' }}>Browse thousands of properties from trusted agents</p>
        <Link to="/search"><button style={{ padding: '15px 40px', fontSize: '16px', background: 'white', color: '#667eea', border: 'none' }}>Browse Properties</button></Link>
      </div>

      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2>How it works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', marginTop: '30px' }}>
            <div className="card">
              <h3>🔍 Explore</h3>
              <p>Browse our vast collection of properties without creating an account</p>
            </div>
            <div className="card">
              <h3>📝 Register</h3>
              <p>Create an account to unlock booking and save favorites</p>
            </div>
            <div className="card">
              <h3>🏠 Book</h3>
              <p>Reserve your property with secure payment and instant confirmation</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3>Ready to get started?</h3>
          <div style={{ marginTop: '20px' }}>
            <Link to="/register"><button style={{ marginRight: '10px' }}>Create Account</button></Link>
            <Link to="/login"><button>Sign In</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
