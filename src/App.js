import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './component/Navbar';
import Home from './component/Home';
import Login from './component/Login';
import Register from './component/Register';
import Dashboard from './component/Dashboard';
import SearchProperties from './component/SearchProperties';
import Bookings from './component/Bookings';
import Profile from './component/Profile';
import Rewards from './component/Rewards';
import Neighborhoods from './component/Neighborhoods';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home token={token} user={user} />} />
          <Route path="/login" element={<Login setToken={setToken} setUser={setUser} />} />
          <Route path="/register" element={<Register setToken={setToken} setUser={setUser} />} />
          <Route path="/dashboard" element={<Dashboard user={user} token={token} />} />
          <Route path="/search" element={<SearchProperties token={token} user={user} />} />
          <Route path="/bookings" element={<Bookings token={token} user={user} />} />
          <Route path="/profile" element={<Profile token={token} user={user} />} />
          <Route path="/rewards" element={<Rewards token={token} user={user} />} />
          <Route path="/neighborhoods" element={<Neighborhoods />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;