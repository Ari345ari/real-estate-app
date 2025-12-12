import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Register({ setToken, setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Renter',
    agency: '',
    job_title: '',
    pref_loc: '',
    budget: '',
    pref_move: ''
  });
  const [message, setMessage] = useState('');

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
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create Account</h2>
        {message && <div className="message error">{message}</div>}

        {/* Role Selection */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setForm({...form, role: 'Renter'})}
            style={{
              flex: 1,
              padding: '15px',
              background: form.role === 'Renter' ? '#667eea' : '#f5f5f5',
              color: form.role === 'Renter' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>🏠</div>
            <div style={{ fontWeight: '600' }}>Renter</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>Find & book properties</div>
          </button>
          <button
            type="button"
            onClick={() => setForm({...form, role: 'Agent'})}
            style={{
              flex: 1,
              padding: '15px',
              background: form.role === 'Agent' ? '#667eea' : '#f5f5f5',
              color: form.role === 'Agent' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>💼</div>
            <div style={{ fontWeight: '600' }}>Agent</div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>List & manage properties</div>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
          </div>

          {form.role === 'Agent' && (
            <>
              <div className="form-group">
                <label>Agency Name</label>
                <input value={form.agency} onChange={(e) => setForm({...form, agency: e.target.value})} placeholder="Your real estate agency" />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input value={form.job_title} onChange={(e) => setForm({...form, job_title: e.target.value})} placeholder="e.g. Senior Agent" />
              </div>
            </>
          )}

          {form.role === 'Renter' && (
            <>
              <div className="form-group">
                <label>Preferred Location</label>
                <input value={form.pref_loc} onChange={(e) => setForm({...form, pref_loc: e.target.value})} placeholder="e.g. Downtown, Suburbs" />
              </div>
              <div className="form-group">
                <label>Budget ($/month)</label>
                <input type="number" value={form.budget} onChange={(e) => setForm({...form, budget: e.target.value})} placeholder="Monthly budget" />
              </div>
              <div className="form-group">
                <label>Preferred Move Date</label>
                <input type="date" value={form.pref_move} onChange={(e) => setForm({...form, pref_move: e.target.value})} />
              </div>
            </>
          )}

          <button type="submit" style={{ width: '100%' }}>Create Account</button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#667eea' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;