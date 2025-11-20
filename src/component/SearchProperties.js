import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SearchProperties({ token, user }) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    price_min: '',
    price_max: '',
    sort: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    rental_start: '',
    rental_end: '',
    card_id: ''
  });
  const [cards, setCards] = useState([]);

  const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (token) {
      fetchCards();
    }
  }, [token]);

  const fetchProperties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/properties/search', { params: filters });
      setProperties(res.data);
    } catch (err) {
      setMessage('Failed to load properties');
    }
  };

  const fetchCards = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/cards', authHeader);
      setCards(res.data);
    } catch (err) {
      console.error('Failed to load cards');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchProperties();
  };

  const handleBookingClick = () => {
    if (!token) {
      setMessage('Please sign in to book properties');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    setSelectedProperty(null);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!bookingForm.rental_start || !bookingForm.rental_end) {
      setMessage('Please enter rental dates');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/bookings/create', {
        property_id: selectedProperty.Property_ID,
        rental_start: bookingForm.rental_start,
        rental_end: bookingForm.rental_end,
        card_id: bookingForm.card_id || null
      }, authHeader);
      setMessage('Booking successful!');
      setSelectedProperty(null);
      setBookingForm({ rental_start: '', rental_end: '', card_id: '' });
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed');
    }
  };

  return (
    <div>
      <h2>🏠 Browse Properties</h2>
      {message && <div className={`message ${message.includes('failed') || message.includes('Please') ? 'error' : 'success'}`}>{message}</div>}

      <div className="card">
        <h3>Search Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          <div className="form-group">
            <label>City</label>
            <input name="city" value={filters.city} onChange={handleFilterChange} placeholder="Enter city" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Vacation">Vacation</option>
              <option value="Land">Land</option>
            </select>
          </div>
          <div className="form-group">
            <label>Min Price</label>
            <input type="number" name="price_min" value={filters.price_min} onChange={handleFilterChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Max Price</label>
            <input type="number" name="price_max" value={filters.price_max} onChange={handleFilterChange} placeholder="10000" />
          </div>
          <div className="form-group">
            <label>Sort By</label>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        <button onClick={handleSearch}>Search</button>
      </div>

      {properties.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No properties found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p style={{ marginTop: '20px' }}>Found <strong>{properties.length}</strong> properties</p>
          <div className="property-grid">
            {properties.map(prop => (
              <div key={prop.Property_ID} className="property-card">
                <div style={{ background: '#f0f0f0', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '48px' }}>
                    {prop.Type === 'Apartment' ? '🏢' : prop.Type === 'House' ? '🏠' : prop.Type === 'Commercial' ? '🏬' : '🏖️'}
                  </span>
                </div>
                <div className="property-card-content">
                  <h3>{prop.Type}</h3>
                  <p>{prop.Description}</p>
                  <p className="price">${prop.Price}/month</p>
                  <p><strong>{prop.City}, {prop.State}</strong></p>
                  {prop.Crime && <p>📊 Crime Rate: {prop.Crime}%</p>}
                  <button onClick={() => token ? setSelectedProperty(prop) : navigate('/login')}>
                    {token ? 'Book Now' : 'Sign In to Book'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedProperty && (
        <div className={`modal show`}>
          <div className="modal-content">
            <h3>📅 Book {selectedProperty.Type}</h3>
            <p><strong>${selectedProperty.Price}/month</strong></p>
            <form onSubmit={handleBooking}>
              <div className="form-group">
                <label>Check-in Date</label>
                <input 
                  type="date" 
                  value={bookingForm.rental_start} 
                  onChange={(e) => setBookingForm({ ...bookingForm, rental_start: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Check-out Date</label>
                <input 
                  type="date" 
                  value={bookingForm.rental_end} 
                  onChange={(e) => setBookingForm({ ...bookingForm, rental_end: e.target.value })}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Payment Card</label>
                <select 
                  value={bookingForm.card_id} 
                  onChange={(e) => setBookingForm({ ...bookingForm, card_id: e.target.value })}
                >
                  <option value="">Select Card</option>
                  {cards.map(card => (
                    <option key={card.Card_ID} value={card.Card_ID}>
                      •••• {card.Card_Number.slice(-4)} (Exp: {new Date(card.Expiry).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit">Confirm Booking</button>
              <button type="button" onClick={() => setSelectedProperty(null)} style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchProperties;