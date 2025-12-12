import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ user, token }) {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    type: 'Apartment',
    description: '',
    price: '',
    city: '',
    state: '',
    sqft: '',
    rooms: '',
    business_type: '',
    image_url: '',
    listing_type: 'rent' // rent or sale
  });

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const isAgent = user?.role === 'Agent' || user?.Role === 'Agent';

  const defaultImages = {
    'Apartment': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'House': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'Commercial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'Vacation': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
    'Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
  };

  useEffect(() => {
    if (isAgent) {
      fetchProperties();
    }
  }, [isAgent]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/properties/agent-properties', authHeader);
      setProperties(res.data);
    } catch (err) {
      setMessage('Failed to load properties');
    }
  };

  const getPropertyImage = (prop) => {
    return prop.image_url || defaultImages[prop.type] || defaultImages['House'];
  };

  const resetForm = () => {
    setForm({
      type: 'Apartment',
      description: '',
      price: '',
      city: '',
      state: '',
      sqft: '',
      rooms: '',
      business_type: '',
      image_url: '',
      listing_type: 'rent'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (prop) => {
    setForm({
      type: prop.type,
      description: prop.description || '',
      price: prop.price || '',
      city: prop.city || '',
      state: prop.state || '',
      sqft: prop.sqft || '',
      rooms: prop.number_of_rooms || '',
      business_type: prop.business_type || '',
      image_url: prop.image_url || '',
      listing_type: prop.listing_type || (prop.type === 'Land' || prop.type === 'Commercial' ? 'sale' : 'rent')
    });
    setEditingId(prop.property_id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/properties/${editingId}`, form, authHeader);
        setMessage('Property updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/properties/create', form, authHeader);
        setMessage('Property created successfully');
      }
      resetForm();
      fetchProperties();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(editingId ? 'Failed to update property' : 'Failed to create property');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this property?')) {
      try {
        await axios.delete(`http://localhost:5000/api/properties/${id}`, authHeader);
        setMessage('Property deleted');
        fetchProperties();
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setMessage('Failed to delete property');
      }
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '20px' }}>My Listings</h2>
      
      {message && (
        <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {isAgent ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: '#666' }}>{properties.length} properties listed</span>
            {!showForm && (
              <button onClick={() => setShowForm(true)}>+ Add Property</button>
            )}
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>{editingId ? 'Edit Property' : 'Add Property'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select 
                      value={form.type} 
                      onChange={(e) => {
                        const newType = e.target.value;
                        // Auto-set listing type for Land and Commercial
                        const newListingType = (newType === 'Land' || newType === 'Commercial') ? 'sale' : form.listing_type;
                        setForm({...form, type: newType, listing_type: newListingType});
                      }}
                    >
                      <option value="Apartment">Apartment</option>
                      <option value="House">House</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Land">Land</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Listing Type</label>
                    <select 
                      value={form.listing_type} 
                      onChange={(e) => setForm({...form, listing_type: e.target.value})}
                      disabled={form.type === 'Land' || form.type === 'Commercial'}
                    >
                      <option value="rent">For Rent</option>
                      <option value="sale">For Sale</option>
                    </select>
                    {(form.type === 'Land' || form.type === 'Commercial') && (
                      <p style={{ fontSize: '12px', color: '#888', margin: '5px 0 0' }}>Land & Commercial are for sale only</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>{form.listing_type === 'sale' ? 'Price ($)' : 'Price ($/month)'}</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Image URL (optional)</label>
                  <input 
                    type="url" 
                    value={form.image_url} 
                    onChange={(e) => setForm({...form, image_url: e.target.value})} 
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Sqft</label>
                    <input type="number" value={form.sqft} onChange={(e) => setForm({...form, sqft: e.target.value})} />
                  </div>
                  {form.type !== 'Commercial' && form.type !== 'Land' && (
                    <div className="form-group">
                      <label>Rooms</label>
                      <input type="number" value={form.rooms} onChange={(e) => setForm({...form, rooms: e.target.value})} />
                    </div>
                  )}
                  {form.type === 'Commercial' && (
                    <div className="form-group">
                      <label>Business Type</label>
                      <input value={form.business_type} onChange={(e) => setForm({...form, business_type: e.target.value})} />
                    </div>
                  )}
                </div>
                <button type="submit">{editingId ? 'Update' : 'Create'}</button>
                <button type="button" className="secondary" onClick={resetForm} style={{ marginLeft: '10px' }}>Cancel</button>
              </form>
            </div>
          )}

          {properties.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666' }}>No properties yet. Add your first listing!</p>
            </div>
          ) : (
            <div className="property-grid">
              {properties.map(prop => (
                <div key={prop.property_id} className="property-card">
                  <img 
                    src={getPropertyImage(prop)} 
                    alt={prop.type}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{prop.type}</h3>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          background: prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? '#e8f5e9' : '#e3f2fd',
                          color: prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? '#2e7d32' : '#1565c0'
                        }}>
                          {prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? 'FOR SALE' : 'FOR RENT'}
                        </span>
                      </div>
                      <span className="price">
                        ${Number(prop.price).toLocaleString()}
                        {prop.listing_type !== 'sale' && prop.type !== 'Land' && prop.type !== 'Commercial' && '/mo'}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>{prop.city}, {prop.state}</p>
                    <p style={{ fontSize: '13px', margin: '8px 0', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.description}</p>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
                      {prop.number_of_rooms > 0 && <span>{prop.number_of_rooms} bd • </span>}
                      {prop.sqft > 0 && <span>{prop.sqft} sqft</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleEdit(prop)} style={{ flex: 1 }}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(prop.property_id)} style={{ flex: 1 }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p style={{ color: '#666' }}>This page is for agents only.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;