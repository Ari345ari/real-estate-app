import React, { useState } from 'react';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Renter',
    password: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Registered successfully! Token: ' + data.token);
      } else {
        setMessage('Error: ' + (data.error || 'Registration failed'));
      }
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="Renter">Renter</option>
          <option value="Agent">Agent</option>
        </select>
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default Register;
