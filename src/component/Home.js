import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home({ token, user }) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    bedrooms: '',
    price_min: '',
    price_max: '',
    listing_type: ''
  });
  const [cards, setCards] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    rental_start: '',
    rental_end: '',
    card_id: '',
    use_points: false,
    points_to_use: ''
  });
  const [myReward, setMyReward] = useState(null);
  const [points, setPoints] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [contactMessage, setContactMessage] = useState('');

  const isRenter = user?.role === 'Renter' || user?.Role === 'Renter';
  const isAgent = user?.role === 'Agent' || user?.Role === 'Agent';
  const pointsPerDollar = 10;

  // Redirect agents to dashboard
  useEffect(() => {
    if (isAgent) {
      navigate('/dashboard');
    }
  }, [isAgent, navigate]);

  // Check for saved property after login
  useEffect(() => {
    const savedPropertyId = localStorage.getItem('viewPropertyId');
    if (savedPropertyId && token && properties.length > 0) {
      const prop = properties.find(p => p.property_id === parseInt(savedPropertyId));
      if (prop) {
        setSelectedProperty(prop);
        setBookingForm({ rental_start: '', rental_end: '', card_id: '', use_points: false, points_to_use: '' });
        setTotalCost(0);
      }
      localStorage.removeItem('viewPropertyId');
    }
  }, [token, properties]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (token && isRenter) {
      fetchCards();
      fetchMyReward();
      fetchPoints();
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
      console.error('Failed to load properties');
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
      console.error('No reward program');
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

  const getCrimeLevel = (crimeRate) => {
    if (!crimeRate) return { text: 'N/A', color: '#888' };
    const rate = parseFloat(crimeRate);
    if (rate <= 3) return { text: 'Low', color: '#27ae60' };
    if (rate <= 6) return { text: 'Medium', color: '#f39c12' };
    return { text: 'High', color: '#e74c3c' };
  };

  const handlePropertyClick = (prop) => {
    setSelectedProperty(prop);
    setBookingForm({ rental_start: '', rental_end: '', card_id: '', use_points: false, points_to_use: '' });
    setTotalCost(0);
    setContactMessage('');
  };

  const handleContactAgent = () => {
    if (!token) {
      // Save property ID for redirect after login
      localStorage.setItem('viewPropertyId', selectedProperty.property_id.toString());
      setShowAuthModal(true);
      return;
    }
    setShowContactModal(true);
  };

  const sendContactRequest = async () => {
    if (!contactMessage.trim()) {
      setMessage('Please enter a message');
      return;
    }
    
    try {
      await axios.post('http://localhost:5000/api/messages/send', {
        property_id: selectedProperty.property_id,
        message: contactMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowContactModal(false);
      setContactMessage('');
      setMessage('Message sent! The agent will contact you soon.');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send message');
    }
  };

  const availablePoints = points - usedPoints;

  const getDiscount = () => {
    if (!bookingForm.use_points || !bookingForm.points_to_use) return 0;
    return Math.floor(parseInt(bookingForm.points_to_use) / pointsPerDollar);
  };

  const getFinalTotal = () => {
    const discount = getDiscount();
    const final = Math.max(0, totalCost - discount);
    return final.toFixed(2);
  };

  const getSelectedCard = () => {
    return cards.find(c => c.card_id === bookingForm.card_id);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!bookingForm.card_id) {
      setMessage('Payment card is required');
      return;
    }

    if (bookingForm.use_points && bookingForm.points_to_use > availablePoints) {
      setMessage('Not enough points');
      return;
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
      fetchPoints();
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Booking failed');
    }
  };

  const isForSale = (prop) => {
    return prop.listing_type === 'sale' || prop.type === 'Land' || prop.type === 'Commercial';
  };

  return (
    <div className="container">
      {/* Hero Section with Video */}
      <div style={{ 
        position: 'relative',
        textAlign: 'center', 
        padding: '60px 20px', 
        marginBottom: '30px',
        borderRadius: '8px',
        overflow: 'hidden',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1
        }}></div>
        <div style={{ position: 'relative', zIndex: 2, color: 'white' }}>
          <h1 style={{ margin: '0 0 10px', fontSize: '36px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>Find Your Perfect Home</h1>
          <p style={{ margin: '0 0 20px', opacity: 0.9, fontSize: '18px' }}>Browse apartments, houses, and more</p>
        </div>
      </div>

      {/* Rewards Advertisement */}
      {!token && (
        <div className="card" style={{ marginBottom: '30px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '48px' }}>🎁</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px', color: '#92400e' }}>Earn Rewards on Every Booking!</h3>
              <p style={{ margin: 0, color: '#a16207', fontSize: '14px' }}>
                Join our rewards program and earn points every time you book. Redeem points for discounts!
              </p>
            </div>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>10 pts</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#a16207' }}>= $1 off</p>
              </div>
              <button onClick={() => navigate('/register')} style={{ background: '#f59e0b', border: 'none' }}>
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      )}

      {message && <div className={`message ${message.includes('failed') || message.includes('required') || message.includes('enough') ? 'error' : 'success'}`}>{message}</div>}

      {/* Search Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>City</label>
            <input value={filters.city} onChange={(e) => setFilters({...filters, city: e.target.value})} placeholder="Any city" />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
              <option value="">All Types</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Commercial">Commercial</option>
              <option value="Vacation">Vacation</option>
              <option value="Land">Land</option>
            </select>
          </div>
          <div className="form-group">
            <label>Listing</label>
            <select value={filters.listing_type} onChange={(e) => setFilters({...filters, listing_type: e.target.value})}>
              <option value="">All</option>
              <option value="rent">For Rent</option>
              <option value="sale">For Sale</option>
            </select>
          </div>
          <div className="form-group">
            <label>Min Beds</label>
            <input type="number" value={filters.bedrooms} onChange={(e) => setFilters({...filters, bedrooms: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Max Price</label>
            <input type="number" value={filters.price_max} onChange={(e) => setFilters({...filters, price_max: e.target.value})} />
          </div>
        </div>
        <button onClick={handleSearch}>Search</button>
      </div>

      {/* Properties */}
      {(() => {
        const displayProperties = token ? properties : properties.slice(0, 6);
        const filteredCount = properties.length;
        const showingCount = displayProperties.length;
        
        return (
          <>
            <h2 style={{ marginBottom: '20px' }}>
              Available Properties ({showingCount}{!token && filteredCount > 6 ? ` of ${filteredCount}` : ''})
            </h2>
            
            <div className="property-grid">
              {displayProperties.map(prop => (
          <div key={prop.property_id} className="property-card" onClick={() => handlePropertyClick(prop)}>
            <img src={getPropertyImage(prop)} alt={prop.type} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div className="property-card-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                <h3 style={{ margin: 0 }}>{prop.type}</h3>
                <span style={{ 
                  fontSize: '10px', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  background: isForSale(prop) ? '#e8f5e9' : '#e3f2fd',
                  color: isForSale(prop) ? '#2e7d32' : '#1565c0'
                }}>
                  {isForSale(prop) ? 'SALE' : 'RENT'}
                </span>
              </div>
              <p className="price">
                ${Number(prop.price).toLocaleString()}
                {!isForSale(prop) && '/mo'}
              </p>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {prop.number_of_rooms > 0 && <span>{prop.number_of_rooms} bd | </span>}
                {prop.sqft > 0 && <span>{prop.sqft} sqft</span>}
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{prop.city}, {prop.state}</p>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#666' }}>No properties found. Try adjusting your search.</p>
        </div>
      )}

      {!token && properties.length > 6 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Sign in to see {properties.length - 6} more properties</p>
          <button onClick={() => navigate('/login')}>Sign In to See More</button>
        </div>
      )}
          </>
        );
      })()}

      {/* Property Detail Modal with Neighborhood Info */}
      {selectedProperty && (
        <div className="modal show" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <img 
              src={getPropertyImage(selectedProperty)} 
              alt={selectedProperty.type}
              style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{selectedProperty.type}</h3>
              <span style={{ 
                fontSize: '12px', 
                padding: '3px 8px', 
                borderRadius: '4px',
                background: isForSale(selectedProperty) ? '#e8f5e9' : '#e3f2fd',
                color: isForSale(selectedProperty) ? '#2e7d32' : '#1565c0'
              }}>
                {isForSale(selectedProperty) ? 'FOR SALE' : 'FOR RENT'}
              </span>
            </div>
            
            <p className="price" style={{ fontSize: '24px', margin: '0 0 10px' }}>
              ${Number(selectedProperty.price).toLocaleString()}
              {!isForSale(selectedProperty) && '/mo'}
            </p>
            
            <p style={{ color: '#666', margin: '10px 0' }}>{selectedProperty.description}</p>
            
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <p><strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state}</p>
              {selectedProperty.number_of_rooms > 0 && <p><strong>Bedrooms:</strong> {selectedProperty.number_of_rooms}</p>}
              {selectedProperty.sqft > 0 && <p><strong>Square Feet:</strong> {selectedProperty.sqft}</p>}
            </div>

            {/* Neighborhood / Things Around */}
            {(selectedProperty.neighborhood_name || selectedProperty.neighborhood_desc || selectedProperty.crime_rate || selectedProperty.nearby_schools) ? (
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 12px' }}>📍 Neighborhood Info</h4>
                
                {selectedProperty.neighborhood_name && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{selectedProperty.neighborhood_name}</p>
                    {selectedProperty.neighborhood_desc && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{selectedProperty.neighborhood_desc}</p>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                  {selectedProperty.crime_rate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🚨</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Crime Rate</p>
                        <p style={{ margin: 0, fontSize: '12px', color: getCrimeLevel(selectedProperty.crime_rate).color, fontWeight: '600' }}>
                          {getCrimeLevel(selectedProperty.crime_rate).text} ({selectedProperty.crime_rate}/10)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedProperty.nearby_schools && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🏫</span>
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>Nearby School</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{selectedProperty.nearby_schools}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 8px' }}>📍 Location</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>{selectedProperty.city}, {selectedProperty.state}</p>
              </div>
            )}

            {/* For Sale - Contact Only */}
            {isForSale(selectedProperty) ? (
              <div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                  This property is for sale. Contact the agent for more information.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleContactAgent} style={{ flex: 1 }}>
                    {token ? 'Contact Agent' : 'Sign In to Contact'}
                  </button>
                  <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                </div>
              </div>
            ) : token && isRenter ? (
              /* For Rent - Booking Form (logged in renters only) */
              <form onSubmit={handleBooking}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in</label>
                    <input type="date" value={bookingForm.rental_start} onChange={(e) => setBookingForm({...bookingForm, rental_start: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Check-out</label>
                    <input type="date" value={bookingForm.rental_end} onChange={(e) => setBookingForm({...bookingForm, rental_end: e.target.value})} required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Payment Card</label>
                  {cards.length > 0 ? (
                    <select value={bookingForm.card_id} onChange={(e) => setBookingForm({...bookingForm, card_id: e.target.value})} required>
                      <option value="">Select card</option>
                      {cards.map(card => (
                        <option key={card.card_id} value={card.card_id}>
                          •••• {card.card_number.slice(-4)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <p style={{ color: '#e74c3c', fontSize: '13px' }}>No cards. Add one in Profile.</p>
                      <button type="button" onClick={() => navigate('/profile')}>Go to Profile</button>
                    </div>
                  )}
                </div>

                {myReward && availablePoints > 0 && (
                  <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={bookingForm.use_points}
                        onChange={(e) => setBookingForm({...bookingForm, use_points: e.target.checked, points_to_use: ''})}
                      />
                      Use points ({availablePoints} available)
                    </label>
                    {bookingForm.use_points && (
                      <input 
                        type="number" 
                        placeholder={`Max ${availablePoints}`}
                        value={bookingForm.points_to_use}
                        onChange={(e) => setBookingForm({...bookingForm, points_to_use: e.target.value})}
                        max={availablePoints}
                        style={{ marginTop: '8px', width: '100%' }}
                      />
                    )}
                  </div>
                )}

                {totalCost > 0 && bookingForm.card_id && (
                  <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                    <p style={{ margin: '3px 0' }}><strong>Subtotal:</strong> ${totalCost}</p>
                    {bookingForm.use_points && bookingForm.points_to_use > 0 && (
                      <p style={{ margin: '3px 0', color: '#e74c3c' }}>
                        <strong>Points Used:</strong> -{bookingForm.points_to_use} pts (-${getDiscount()})
                      </p>
                    )}
                    <p style={{ margin: '3px 0', fontSize: '16px', fontWeight: 'bold' }}><strong>Total:</strong> ${getFinalTotal()}</p>
                    {myReward && (
                      <p style={{ margin: '8px 0 3px', color: '#27ae60' }}>
                        <strong>Points Earning:</strong> +{myReward.award_points} pts
                      </p>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  {cards.length > 0 && <button type="submit" style={{ flex: 1 }}>Book Now</button>}
                  <button type="button" onClick={handleContactAgent} style={{ flex: 1 }}>Contact Agent</button>
                  <button type="button" className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                </div>
              </form>
            ) : (
              /* Not logged in or not a renter */
              <div>
                {!token ? (
                  <>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                      Sign in to book this property or contact the agent.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => navigate('/login')} style={{ flex: 1 }}>Sign In</button>
                      <button onClick={() => navigate('/register')} style={{ flex: 1 }}>Register</button>
                      <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleContactAgent} style={{ flex: 1 }}>Contact Agent</button>
                    <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal show" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Sign In Required</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>Please sign in to view property details.</p>
            <button onClick={() => navigate('/login')} style={{ width: '100%', marginBottom: '10px' }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{ width: '100%', marginBottom: '10px' }}>Create Account</button>
            <button className="secondary" onClick={() => setShowAuthModal(false)} style={{ width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="modal show" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Contact Agent</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Send a message about: <strong>{selectedProperty?.type}</strong> in {selectedProperty?.city}, {selectedProperty?.state}
            </p>
            <div className="form-group">
              <label>Your Message</label>
              <textarea 
                placeholder="I'm interested in this property..." 
                style={{ minHeight: '100px' }}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
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

export default Home;