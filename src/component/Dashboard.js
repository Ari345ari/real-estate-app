import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ user, token }) {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    type: 'Apartment',
    description: '',
    price: '',
    city: '',
    state: '',
    neighborhood_id: '',
    sqft: '',
    rooms: '',
    business_type: ''
  });

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/properties/agent-properties', authHeader);
      setProperties(res.data);
    } catch (err) {
      setMessage('Failed to load properties');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/properties/create', form, authHeader);
      setMessage('Property created successfully');
      setForm({
        type: 'Apartment',
        description: '',
        price: '',
        city: '',
        state: '',
        neighborhood_id: '',
        sqft: '',
        rooms: '',
        business_type: ''
      });
      setShowForm(false);
      fetchProperties();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this property?')) {
      try {
        await axios.delete(`http://localhost:5000/api/properties/${id}`, authHeader);
        setMessage('Property deleted');
        fetchProperties();
      } catch (err) {
        setMessage('Failed to delete property');
      }
    }
  };

  return (
    <div>
      {user?.Role === 'Agent' && (
        <>
          <h2>Agent Dashboard</h2>
          {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}
          
          {!showForm ? (
            <button onClick={() => setShowForm(true)}>Add New Property</button>
          ) : (
            <div className="card">
              <h3>Create Property</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option value="Apartment">Apartment</option>
                    <option value="House">House</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Land">Land</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Price</label>
                  <input type="number" name="price" value={form.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input name="state" value={form.state} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Square Footage</label>
                  <input type="number" name="sqft" value={form.sqft} onChange={handleChange} />
                </div>
                {form.type !== 'Commercial' && form.type !== 'Land' && (
                  <div className="form-group">
                    <label>Number of Rooms</label>
                    <input type="number" name="rooms" value={form.rooms} onChange={handleChange} />
                  </div>
                )}
                {form.type === 'Commercial' && (
                  <div className="form-group">
                    <label>Business Type</label>
                    <input name="business_type" value={form.business_type} onChange={handleChange} />
                  </div>
                )}
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
              </form>
            </div>
          )}

          <div className="property-grid">
            {properties.map(prop => (
              <div key={prop.Property_ID} className="property-card">
                <div className="property-card-content">
                  <h3>{prop.Type}</h3>
                  <p>{prop.Description}</p>
                  <p className="price">${prop.Price}/month</p>
                  <p><strong>{prop.City}, {prop.State}</strong></p>
                  <p>Available: {prop.Available ? 'Yes' : 'No'}</p>
                  <button onClick={() => handleDelete(prop.Property_ID)} className="danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {user?.Role === 'Renter' && (
        <div>
          <h2>Welcome, {user.Name}!</h2>
          <p>Go to Search to find properties, or check your Bookings.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;