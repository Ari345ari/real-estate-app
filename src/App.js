import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import Home from './component/Home';
import Register from './component/Register';
import Login from './component/Login';
import Dashboard from './component/Dashboard';
import SearchProperties from './component/SearchProperties';
import Bookings from './component/Bookings';
import Profile from './component/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          {token && (
            <>
              <Route path="/dashboard" element={<Dashboard user={user} token={token} />} />
              <Route path="/search" element={<SearchProperties token={token} />} />
              <Route path="/bookings" element={<Bookings token={token} user={user} />} />
              <Route path="/profile" element={<Profile token={token} user={user} />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;