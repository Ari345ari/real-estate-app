import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register({ setToken, setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'Renter',
    agency: '', job_title: '', pref_loc: '', budget: '', pref_move: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div className="card">
        <h2>Register</h2>
        {message && <div className="message error">{message}</div>}
        <form onSubmit={handleSubmit}>
  <div className="form-group">
    <label>Name</label>
    <input name="name" value={form.name} onChange={handleChange} required />
  </div>
  
  <div className="form-group">
    <label>Email</label>
    <input type="email" name="email" value={form.email} onChange={handleChange} required />
  </div>
  
  <div className="form-group">
    <label>Phone</label>
    <input name="phone" value={form.phone} onChange={handleChange} required />
  </div>

  <div className="form-group">
    <label>Role</label>
    <select name="role" value={form.role} onChange={handleChange}>
      <option value="Renter">Renter</option>
      <option value="Agent">Agent</option>
    </select>
  </div>
          {form.role === 'Agent' && (
            <>
              <div className="form-group">
                <label>Agency</label>
                <input name="agency" value={form.agency} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input name="job_title" value={form.job_title} onChange={handleChange} />
              </div>
            </>
          )}
          {form.role === 'Renter' && (
            <>
              <div className="form-group">
                <label>Preferred Location</label>
                <input name="pref_loc" value={form.pref_loc} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Budget</label>
                <input type="number" name="budget" value={form.budget} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Preferred Move Date</label>
                <input type="date" name="pref_move" value={form.pref_move} onChange={handleChange} />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
}

export default Register;
