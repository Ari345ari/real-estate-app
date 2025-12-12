import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Neighborhood Preview Component
function NeighborhoodPreview() {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState([]);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/neighborhoods');
      setNeighborhoods(res.data.slice(0, 4)); // Show first 4
    } catch (err) {
      console.error('Failed to load neighborhoods');
    }
  };

  const getNeighborhoodImage = (location) => {
    const images = {
      'downtown': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
      'suburb': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
      'mountain': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
      'urban': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
      'rural': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
    };
    
    const loc = location?.toLowerCase() || '';
    for (const key in images) {
      if (loc.includes(key)) {
        return images[key];
      }
    }
    return 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800';
  };

  if (neighborhoods.length === 0) return null;

  return (
    <>
      <div className="property-grid">
        {neighborhoods.map(neighborhood => (
          <div 
            key={neighborhood.neighborhood_id} 
            className="property-card" 
            onClick={() => navigate(`/neighborhoods`)}
            style={{ cursor: 'pointer' }}
          >
            <img 
              src={getNeighborhoodImage(neighborhood.location)} 
              alt={neighborhood.location}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
            <div className="property-card-content">
              <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>{neighborhood.location}</h3>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                {neighborhood.property_count || 0} properties
              </p>
              {neighborhood.avg_price && (
                <p style={{ fontSize: '13px', color: '#888', margin: '5px 0 0' }}>
                  From ${Number(neighborhood.avg_price).toLocaleString()}/mo
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <button className="secondary" onClick={() => navigate('/neighborhoods')}>View All Neighborhoods</button>
      </div>
    </>
  );
}

function Home({ token, user }) {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactProperty, setContactProperty] = useState(null);
  const [message, setMessage] = useState('');

  const isRenter = user?.role === 'Renter' || user?.Role === 'Renter';

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/properties/search');
      setProperties(res.data);
    } catch (err) {
      console.error('Failed to load properties');
    }
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

  const handleContactAgent = (prop, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setContactProperty(prop || selectedProperty);
    setShowContactModal(true);
  };

  const sendContactRequest = () => {
    setShowContactModal(false);
    setContactProperty(null);
    setSelectedProperty(null);
    setMessage('Contact request sent to agent!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBookNow = () => {
    setSelectedProperty(null);
    navigate('/search');
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
          <button 
            onClick={() => navigate('/search')} 
            style={{ background: 'white', color: '#333', fontWeight: '600', padding: '12px 30px', fontSize: '16px' }}
          >
            Start Searching
          </button>
        </div>
      </div>

      {/* Rewards Advertisement */}
      <div className="card" style={{ marginBottom: '30px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '48px' }}>🎁</div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ margin: '0 0 8px', color: '#92400e' }}>Earn Rewards on Every Booking!</h3>
            <p style={{ margin: 0, color: '#a16207', fontSize: '14px' }}>
              Join our rewards program and earn points every time you book. Redeem points for discounts on future rentals!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>10 pts</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#a16207' }}>= $1 off</p>
            </div>
            {!token ? (
              <button onClick={() => navigate('/register')} style={{ background: '#f59e0b', border: 'none' }}>
                Sign Up Free
              </button>
            ) : !isRenter ? null : (
              <button onClick={() => navigate('/rewards')} style={{ background: '#f59e0b', border: 'none' }}>
                View Rewards
              </button>
            )}
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '20px' }}>Available Properties</h2>
      
      {message && <div className="message success">{message}</div>}
      
      <div className="property-grid">
        {properties.slice(0, 6).map(prop => (
          <div key={prop.property_id} className="property-card" onClick={() => setSelectedProperty(prop)}>
            <img 
              src={getPropertyImage(prop)} 
              alt={prop.type}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div className="property-card-content">
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>{prop.type}</h3>
              <p className="price">${Number(prop.price).toLocaleString()}/mo</p>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {prop.number_of_rooms > 0 && <span>{prop.number_of_rooms} bd | </span>}
                {prop.sqft > 0 && <span>{prop.sqft} sqft</span>}
              </div>
              <p style={{ fontSize: '14px', color: '#666' }}>{prop.city}, {prop.state}</p>
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

      {properties.length > 6 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => navigate('/search')}>View All Properties</button>
        </div>
      )}

      {/* Neighborhoods Section */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>Explore Neighborhoods</h2>
        <NeighborhoodPreview />
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="modal show" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getPropertyImage(selectedProperty)} 
              alt={selectedProperty.type}
              style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }}
            />
            
            <h3>{selectedProperty.type}</h3>
            <p className="price">${Number(selectedProperty.price).toLocaleString()}/mo</p>
            <p style={{ color: '#666', margin: '15px 0' }}>{selectedProperty.description}</p>
            
            <div style={{ marginBottom: '15px', fontSize: '14px' }}>
              <p><strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state}</p>
              {selectedProperty.number_of_rooms > 0 && <p><strong>Bedrooms:</strong> {selectedProperty.number_of_rooms}</p>}
              {selectedProperty.sqft > 0 && <p><strong>Square Feet:</strong> {selectedProperty.sqft}</p>}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => handleContactAgent(null)} style={{ flex: 1 }}>
                Contact Agent
              </button>
              {token && isRenter && (
                <button onClick={handleBookNow} style={{ flex: 1 }}>
                  Book Now
                </button>
              )}
              {token && !isRenter && (
                <button onClick={handleBookNow} className="secondary" style={{ flex: 1 }}>
                  View Details
                </button>
              )}
              <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal - for non-logged in users */}
      {showAuthModal && (
        <div className="modal show" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Sign In Required</h3>
            <p style={{ marginBottom: '20px', color: '#666' }}>Please sign in or create an account to contact agents.</p>
            <button onClick={() => navigate('/login')} style={{ width: '100%', marginBottom: '10px' }}>Sign In</button>
            <button onClick={() => navigate('/register')} style={{ width: '100%', marginBottom: '10px' }}>Create Account</button>
            <button className="secondary" onClick={() => setShowAuthModal(false)} style={{ width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Contact Agent Modal - for logged in users */}
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
                placeholder="I'm interested in this property and would like to schedule a viewing..."
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

export default Home;