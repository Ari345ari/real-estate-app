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
    bedrooms: '',
    price_min: '',
    price_max: ''
  });
  const [sortBy, setSortBy] = useState('price_asc');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    rental_start: '',
    rental_end: '',
    card_id: '',
    use_points: false,
    points_to_use: ''
  });
  const [cards, setCards] = useState([]);
  const [myReward, setMyReward] = useState(null);
  const [points, setPoints] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactProperty, setContactProperty] = useState(null);
  const [totalCost, setTotalCost] = useState(0);

  const isRenter = user?.role === 'Renter' || user?.Role === 'Renter';
  const pointsPerDollar = 10;

  useEffect(() => {
    fetchProperties();
    if (token) {
      fetchCards();
      if (isRenter) {
        fetchMyReward();
        fetchPoints();
      }
    }
  }, [token, isRenter]);

  useEffect(() => {
    if (selectedProperty && bookingForm.rental_start && bookingForm.rental_end) {
      const start = new Date(bookingForm.rental_start);
      const end = new Date(bookingForm.rental_end);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (days > 0) {
        const total = (selectedProperty.price * days / 30).toFixed(2);
        setTotalCost(total);
      } else {
        setTotalCost(0);
      }
    }
  }, [bookingForm.rental_start, bookingForm.rental_end, selectedProperty]);

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
      const res = await axios.get('http://localhost:5000/api/users/cards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(res.data);
    } catch (err) {
      console.error('Failed to load cards');
    }
  };

  const fetchMyReward = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rewards/my-reward', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyReward(res.data);
    } catch (err) {
      console.error('No reward program joined');
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rewards/my-points', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPoints(res.data.earned || 0);
      setUsedPoints(res.data.used || 0);
    } catch (err) {
      console.error('Failed to load points');
    }
  };

  const handleSearch = () => {
    fetchProperties();
  };

  const handleSort = (sortType) => {
    setSortBy(sortType);
    let sorted = [...properties];
    switch(sortType) {
      case 'price_asc':
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'bedrooms_asc':
        sorted.sort((a, b) => (a.number_of_rooms || 0) - (b.number_of_rooms || 0));
        break;
      case 'bedrooms_desc':
        sorted.sort((a, b) => (b.number_of_rooms || 0) - (a.number_of_rooms || 0));
        break;
      default:
        break;
    }
    setProperties(sorted);
  };

  const handlePropertyClick = (prop) => {
    if (!token) {
      navigate('/login');
      return;
    }
    setSelectedProperty(prop);
    setTotalCost(0);
    setBookingForm({ rental_start: '', rental_end: '', card_id: '', use_points: false, points_to_use: '' });
  };

  const availablePoints = points - usedPoints;
  const maxDiscount = Math.floor(availablePoints / pointsPerDollar);
  
  const getDiscount = () => {
    if (!bookingForm.use_points || !bookingForm.points_to_use) return 0;
    return Math.floor(parseInt(bookingForm.points_to_use) / pointsPerDollar);
  };

  const getFinalTotal = () => {
    const discount = getDiscount();
    const final = Math.max(0, totalCost - discount);
    return final.toFixed(2);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (!isRenter) {
      setMessage('Only renters can book properties');
      setSelectedProperty(null);
      return;
    }

    if (!bookingForm.card_id) {
      setMessage('Payment card is required for booking');
      return;
    }

    // Validate points if using them
    if (bookingForm.use_points && bookingForm.points_to_use) {
      const pointsToUse = parseInt(bookingForm.points_to_use);
      if (pointsToUse > availablePoints) {
        setMessage('Not enough points');
        return;
      }
    }
    
    try {
      await axios.post('http://localhost:5000/api/bookings/create', {
        property_id: selectedProperty.property_id,
        rental_start: bookingForm.rental_start,
        rental_end: bookingForm.rental_end,
        card_id: bookingForm.card_id,
        use_points: bookingForm.use_points,
        points_to_use: bookingForm.use_points ? parseInt(bookingForm.points_to_use) : 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('Booking successful!');
      setSelectedProperty(null);
      setBookingForm({ rental_start: '', rental_end: '', card_id: '', use_points: false, points_to_use: '' });
      fetchPoints();
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleContactAgent = (prop, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      navigate('/login');
      return;
    }
    setContactProperty(prop);
    setShowContactModal(true);
  };

  const sendContactRequest = () => {
    setShowContactModal(false);
    setContactProperty(null);
    setMessage('Contact request sent to agent!');
    setTimeout(() => setMessage(''), 3000);
  };

  const getPropertyImage = (property) => {
    if (property.image_url) return property.image_url;
    const images = {
      'Apartment': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'House': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'Commercial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
      'Vacation': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      'Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
    };
    return images[property.type] || images['House'];
  };

  const getSelectedCard = () => {
    return cards.find(c => c.card_id == bookingForm.card_id);
  };

  return (
    <div className="container">
      <h2>Search Properties</h2>
      {message && <div className={`message ${message.includes('Failed') || message.includes('required') || message.includes('Not enough') ? 'error' : 'success'}`}>{message}</div>}

      {/* Rewards Info for Renters */}
      {token && isRenter && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Your Points</p>
              <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{availablePoints}</p>
            </div>
            {myReward ? (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Earning</p>
                <p style={{ margin: '5px 0 0', fontSize: '16px', fontWeight: '600' }}>{myReward.award_points} pts/booking</p>
              </div>
            ) : (
              <button onClick={() => navigate('/rewards')}>Join Rewards</button>
            )}
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input name="city" value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
              <option value="">All</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Vacation">Vacation</option>
              <option value="Land">Land</option>
            </select>
          </div>
          <div className="form-group">
            <label>Min Bedrooms</label>
            <input type="number" name="bedrooms" value={filters.bedrooms} onChange={(e) => setFilters({...filters, bedrooms: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Min Price</label>
            <input type="number" name="price_min" value={filters.price_min} onChange={(e) => setFilters({...filters, price_min: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Max Price</label>
            <input type="number" name="price_max" value={filters.price_max} onChange={(e) => setFilters({...filters, price_max: e.target.value})} />
          </div>
        </div>
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Results Header with Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
        <p>Found {properties.length} properties</p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Sort by:</span>
          <select value={sortBy} onChange={(e) => handleSort(e.target.value)} style={{ padding: '5px 10px' }}>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="bedrooms_asc">Bedrooms: Low to High</option>
            <option value="bedrooms_desc">Bedrooms: High to Low</option>
          </select>
        </div>
      </div>
      
      {/* Property Grid */}
      <div className="property-grid">
        {properties.map(prop => (
          <div key={prop.property_id} className="property-card" onClick={() => handlePropertyClick(prop)}>
            <img src={getPropertyImage(prop)} alt={prop.type} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div className="property-card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                <h3 style={{ margin: 0 }}>{prop.type}</h3>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? '#e8f5e9' : '#e3f2fd',
                  color: prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? '#2e7d32' : '#1565c0'
                }}>
                  {prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial' ? 'SALE' : 'RENT'}
                </span>
              </div>
              <p className="price">
                ${Number(prop.price).toLocaleString()}
                {prop.listing_type !== 'sale' && prop.type !== 'Land' && prop.type !== 'Commercial' && '/mo'}
              </p>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {prop.number_of_rooms > 0 && <span>{prop.number_of_rooms} bd | </span>}
                {prop.sqft > 0 && <span>{prop.sqft} sqft</span>}
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{prop.city}, {prop.state}</p>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prop.description}
              </p>
              {token && (
                <button 
                  className="secondary" 
                  onClick={(e) => handleContactAgent(prop, e)}
                  style={{ marginTop: '10px', width: '100%', fontSize: '13px' }}
                >
                  Contact Agent
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedProperty && (
        <div className="modal show" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getPropertyImage(selectedProperty)} 
              alt={selectedProperty.type}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }}
            />
            <h3>{selectedProperty.type}</h3>
            <p className="price">
              ${Number(selectedProperty.price).toLocaleString()}
              {selectedProperty.listing_type !== 'sale' && selectedProperty.type !== 'Land' && selectedProperty.type !== 'Commercial' && '/mo'}
            </p>
            <span style={{ 
              fontSize: '12px', 
              padding: '3px 8px', 
              borderRadius: '4px',
              background: selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? '#e8f5e9' : '#e3f2fd',
              color: selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? '#2e7d32' : '#1565c0'
            }}>
              {selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? 'FOR SALE' : 'FOR RENT'}
            </span>
            <p style={{ color: '#666', margin: '10px 0' }}>{selectedProperty.description}</p>
            
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <p><strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state}</p>
              {selectedProperty.number_of_rooms > 0 && <p><strong>Bedrooms:</strong> {selectedProperty.number_of_rooms}</p>}
              {selectedProperty.sqft > 0 && <p><strong>Square Feet:</strong> {selectedProperty.sqft}</p>}
            </div>

            {isRenter ? (
              // Check if it's for sale (Land, Commercial, or listing_type === 'sale')
              (selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial') ? (
                <div>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    This property is for sale. Contact the agent for more information.
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleContactAgent(selectedProperty)} style={{ flex: 1 }}>Contact Agent</button>
                    <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleBooking}>
                <div className="form-group">
                  <label>Check-in Date *</label>
                  <input type="date" value={bookingForm.rental_start} onChange={(e) => setBookingForm({...bookingForm, rental_start: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Check-out Date *</label>
                  <input type="date" value={bookingForm.rental_end} onChange={(e) => setBookingForm({...bookingForm, rental_end: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Payment Card *</label>
                  {cards.length > 0 ? (
                    <select value={bookingForm.card_id} onChange={(e) => setBookingForm({...bookingForm, card_id: e.target.value})} required>
                      <option value="">Select a card</option>
                      {cards.map(card => (
                        <option key={card.card_id} value={card.card_id}>
                          •••• {card.card_number.slice(-4)} ({card.expiry_month}/{card.expiry_year})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <p style={{ color: '#e74c3c', fontSize: '14px', margin: '5px 0' }}>
                        No cards on file. Add a card to book.
                      </p>
                      <button type="button" onClick={() => navigate('/profile')} style={{ width: '100%' }}>
                        Add Card in Profile
                      </button>
                    </div>
                  )}
                </div>

                {/* Use Reward Points */}
                {myReward && availablePoints > 0 && (
                  <div className="form-group" style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={bookingForm.use_points}
                        onChange={(e) => setBookingForm({...bookingForm, use_points: e.target.checked, points_to_use: ''})}
                      />
                      Use reward points ({availablePoints} available)
                    </label>
                    {bookingForm.use_points && (
                      <div style={{ marginTop: '10px' }}>
                        <input 
                          type="number" 
                          placeholder={`Enter points (max ${availablePoints})`}
                          value={bookingForm.points_to_use}
                          onChange={(e) => setBookingForm({...bookingForm, points_to_use: e.target.value})}
                          max={availablePoints}
                          style={{ width: '100%' }}
                        />
                        <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0' }}>
                          10 pts = $1 discount (max ${maxDiscount} off)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Summary */}
                {totalCost > 0 && bookingForm.card_id && (
                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px' }}>Booking Summary</h4>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}>
                      <strong>Rental Period:</strong> {bookingForm.rental_start} to {bookingForm.rental_end}
                    </p>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}>
                      <strong>Subtotal:</strong> ${totalCost}
                    </p>
                    {bookingForm.use_points && bookingForm.points_to_use > 0 && (
                      <p style={{ fontSize: '14px', margin: '5px 0', color: '#27ae60' }}>
                        <strong>Points Discount:</strong> -${getDiscount()} ({bookingForm.points_to_use} pts)
                      </p>
                    )}
                    <p style={{ fontSize: '16px', margin: '10px 0 5px', fontWeight: 'bold' }}>
                      <strong>Total:</strong> ${getFinalTotal()}
                    </p>
                    <p style={{ fontSize: '14px', margin: '5px 0' }}>
                      <strong>Payment:</strong> Card ending in {getSelectedCard()?.card_number.slice(-4)}
                    </p>
                    {myReward && (
                      <p style={{ fontSize: '14px', margin: '5px 0', color: '#27ae60' }}>
                        <strong>Points Earned:</strong> +{myReward.award_points} pts
                      </p>
                    )}
                  </div>
                )}

                {cards.length > 0 && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{ flex: 1 }}>Book Now</button>
                    <button type="button" onClick={() => handleContactAgent(selectedProperty)} style={{ flex: 1 }} className="secondary">Contact Agent</button>
                  </div>
                )}
                <button type="button" className="secondary" onClick={() => setSelectedProperty(null)} style={{ width: '100%', marginTop: '10px' }}>Cancel</button>
              </form>
              )
            ) : (
              <div>
                <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '15px' }}>
                  {token ? 'Only renters can book properties.' : 'Please log in to book.'}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleContactAgent(selectedProperty)} style={{ flex: 1 }}>Contact Agent</button>
                  <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Agent Modal */}
      {showContactModal && contactProperty && (
        <div className="modal show" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Contact Agent</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Send an inquiry about <strong>{contactProperty.type}</strong> in {contactProperty.city}, {contactProperty.state}
            </p>
            <div className="form-group">
              <label>Your Message</label>
              <textarea 
                placeholder="I'm interested in this property..."
                style={{ minHeight: '100px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={sendContactRequest} style={{ flex: 1 }}>Send Message</button>
              <button className="secondary" onClick={() => setShowContactModal(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchProperties;