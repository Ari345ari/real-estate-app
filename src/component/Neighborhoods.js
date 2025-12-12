import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Neighborhoods({ token, user }) {
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [message, setMessage] = useState('');

  const isRenter = user?.role === 'Renter' || user?.Role === 'Renter';

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  const fetchNeighborhoods = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/neighborhoods');
      setNeighborhoods(res.data);
    } catch (err) {
      setMessage('Failed to load neighborhoods');
    }
  };

  const fetchNeighborhoodProperties = async (neighborhoodId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/neighborhoods/${neighborhoodId}`);
      setSelectedNeighborhood(res.data.neighborhood);
      setProperties(res.data.properties);
    } catch (err) {
      setMessage('Failed to load properties');
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

  // Mock nearby amenities based on neighborhood
  const getNearbyAmenities = (location) => {
    const loc = location?.toLowerCase() || '';
    
    if (loc.includes('downtown') || loc.includes('urban')) {
      return [
        { icon: '🏢', name: 'Business District', distance: '0.2 mi' },
        { icon: '🍽️', name: 'Restaurants', distance: '0.1 mi' },
        { icon: '🚇', name: 'Metro Station', distance: '0.3 mi' },
        { icon: '🏥', name: 'Hospital', distance: '0.8 mi' },
        { icon: '🛒', name: 'Shopping Mall', distance: '0.4 mi' },
        { icon: '☕', name: 'Coffee Shops', distance: '0.1 mi' }
      ];
    } else if (loc.includes('beach') || loc.includes('coast')) {
      return [
        { icon: '🏖️', name: 'Beach', distance: '0.1 mi' },
        { icon: '🏄', name: 'Surf Shop', distance: '0.3 mi' },
        { icon: '🍹', name: 'Beach Bars', distance: '0.2 mi' },
        { icon: '🐠', name: 'Aquarium', distance: '1.2 mi' },
        { icon: '⛵', name: 'Marina', distance: '0.5 mi' },
        { icon: '🏨', name: 'Hotels', distance: '0.4 mi' }
      ];
    } else if (loc.includes('suburb')) {
      return [
        { icon: '🏫', name: 'Schools', distance: '0.5 mi' },
        { icon: '🌳', name: 'Parks', distance: '0.3 mi' },
        { icon: '🛒', name: 'Grocery Store', distance: '0.4 mi' },
        { icon: '🏥', name: 'Medical Center', distance: '1.0 mi' },
        { icon: '⛪', name: 'Community Center', distance: '0.6 mi' },
        { icon: '🎾', name: 'Sports Complex', distance: '0.8 mi' }
      ];
    } else if (loc.includes('mountain') || loc.includes('rural')) {
      return [
        { icon: '⛰️', name: 'Hiking Trails', distance: '0.2 mi' },
        { icon: '🏕️', name: 'Campgrounds', distance: '1.5 mi' },
        { icon: '🎿', name: 'Ski Resort', distance: '3.0 mi' },
        { icon: '🦌', name: 'Nature Reserve', distance: '0.8 mi' },
        { icon: '🏪', name: 'General Store', distance: '2.0 mi' },
        { icon: '🌲', name: 'National Park', distance: '5.0 mi' }
      ];
    }
    
    // Default amenities
    return [
      { icon: '🏪', name: 'Convenience Store', distance: '0.3 mi' },
      { icon: '🏫', name: 'School', distance: '0.7 mi' },
      { icon: '🌳', name: 'Park', distance: '0.4 mi' },
      { icon: '🏥', name: 'Clinic', distance: '1.0 mi' },
      { icon: '🍽️', name: 'Restaurants', distance: '0.5 mi' },
      { icon: '🚌', name: 'Bus Stop', distance: '0.2 mi' }
    ];
  };

  const handleNeighborhoodClick = (neighborhood) => {
    fetchNeighborhoodProperties(neighborhood.neighborhood_id);
  };

  const handlePropertyClick = (prop) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    setSelectedProperty(prop);
  };

  const handleContactAgent = () => {
    setShowContactModal(true);
  };

  const sendContactRequest = () => {
    setShowContactModal(false);
    setSelectedProperty(null);
    setMessage('Contact request sent to agent!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBookNow = () => {
    setSelectedProperty(null);
    navigate('/search');
  };

  const handleBack = () => {
    setSelectedNeighborhood(null);
    setProperties([]);
  };

  // View of a single neighborhood with properties and amenities
  if (selectedNeighborhood) {
    const amenities = getNearbyAmenities(selectedNeighborhood.location);
    
    return (
      <div className="container">
        <button onClick={handleBack} className="secondary" style={{ marginBottom: '20px' }}>
          ← Back to Neighborhoods
        </button>

        {/* Neighborhood Header */}
        <div style={{ 
          position: 'relative', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          marginBottom: '20px',
          height: '200px'
        }}>
          <img 
            src={getNeighborhoodImage(selectedNeighborhood.location)} 
            alt={selectedNeighborhood.location}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            color: 'white'
          }}>
            <h2 style={{ margin: 0 }}>{selectedNeighborhood.location}</h2>
            {selectedNeighborhood.description && (
              <p style={{ margin: '5px 0 0', opacity: 0.9 }}>{selectedNeighborhood.description}</p>
            )}
          </div>
        </div>

        {/* Things Around / Nearby Amenities */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px' }}>📍 Things Around</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
            {amenities.map((amenity, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontSize: '24px' }}>{amenity.icon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{amenity.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{amenity.distance}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties in this Neighborhood */}
        <h3 style={{ marginBottom: '15px' }}>Properties in {selectedNeighborhood.location}</h3>
        
        {properties.length === 0 ? (
          <div className="card">
            <p style={{ color: '#666' }}>No properties available in this area.</p>
          </div>
        ) : (
          <div className="property-grid">
            {properties.map(prop => (
              <div 
                key={prop.property_id} 
                className="property-card"
                onClick={() => handlePropertyClick(prop)}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={getPropertyImage(prop)} 
                  alt={prop.type}
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
                <div className="property-card-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{prop.type}</h3>
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
                  <p className="price" style={{ fontSize: '16px' }}>
                    ${Number(prop.price).toLocaleString()}
                    {prop.listing_type !== 'sale' && prop.type !== 'Land' && prop.type !== 'Commercial' && '/mo'}
                  </p>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {prop.number_of_rooms > 0 && <span>{prop.number_of_rooms} bd • </span>}
                    {prop.sqft > 0 && <span>{prop.sqft} sqft</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Property Detail Modal */}
        {selectedProperty && (
          <div className="modal show" onClick={() => setSelectedProperty(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <img 
                src={getPropertyImage(selectedProperty)} 
                alt={selectedProperty.type}
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '15px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{selectedProperty.type}</h3>
                <span style={{ 
                  fontSize: '12px', 
                  padding: '3px 8px', 
                  borderRadius: '4px',
                  background: selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? '#e8f5e9' : '#e3f2fd',
                  color: selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? '#2e7d32' : '#1565c0'
                }}>
                  {selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial' ? 'FOR SALE' : 'FOR RENT'}
                </span>
              </div>
              <p className="price" style={{ fontSize: '20px', margin: '0 0 10px' }}>
                ${Number(selectedProperty.price).toLocaleString()}
                {selectedProperty.listing_type !== 'sale' && selectedProperty.type !== 'Land' && selectedProperty.type !== 'Commercial' && '/mo'}
              </p>
              <p style={{ color: '#666', margin: '10px 0' }}>{selectedProperty.description}</p>
              
              <div style={{ marginBottom: '15px', fontSize: '14px' }}>
                <p><strong>Location:</strong> {selectedProperty.city}, {selectedProperty.state}</p>
                {selectedProperty.number_of_rooms > 0 && <p><strong>Bedrooms:</strong> {selectedProperty.number_of_rooms}</p>}
                {selectedProperty.sqft > 0 && <p><strong>Square Feet:</strong> {selectedProperty.sqft}</p>}
              </div>

              {/* For Sale - Contact Only */}
              {(selectedProperty.listing_type === 'sale' || selectedProperty.type === 'Land' || selectedProperty.type === 'Commercial') ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleContactAgent} style={{ flex: 1 }}>Contact Agent</button>
                  <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {isRenter && <button onClick={handleBookNow} style={{ flex: 1 }}>Book Now</button>}
                  <button onClick={handleContactAgent} style={{ flex: 1 }}>Contact Agent</button>
                  <button className="secondary" onClick={() => setSelectedProperty(null)} style={{ flex: 1 }}>Close</button>
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
              <p style={{ marginBottom: '20px', color: '#666' }}>Please sign in or create an account to view property details.</p>
              <button onClick={() => navigate('/login')} style={{ width: '100%', marginBottom: '10px' }}>Sign In</button>
              <button onClick={() => navigate('/register')} style={{ width: '100%', marginBottom: '10px' }}>Create Account</button>
              <button className="secondary" onClick={() => setShowAuthModal(false)} style={{ width: '100%' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Contact Agent Modal */}
        {showContactModal && (
          <div className="modal show" onClick={() => setShowContactModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Contact Agent</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Send an inquiry about this property
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

  // Main neighborhoods list
  return (
    <div className="container">
      <h2>Explore Neighborhoods</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Find the perfect area for your next home</p>
      
      {message && <div className="message error">{message}</div>}

      {neighborhoods.length === 0 ? (
        <div className="card">
          <p style={{ color: '#666' }}>No neighborhoods available.</p>
        </div>
      ) : (
        <div className="property-grid">
          {neighborhoods.map(neighborhood => (
            <div 
              key={neighborhood.neighborhood_id} 
              className="property-card" 
              onClick={() => handleNeighborhoodClick(neighborhood)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={getNeighborhoodImage(neighborhood.location)} 
                alt={neighborhood.location}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <div className="property-card-content">
                <h3 style={{ margin: '0 0 8px' }}>{neighborhood.location}</h3>
                {neighborhood.description && (
                  <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px' }}>{neighborhood.description}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {neighborhood.property_count || 0} properties
                  </span>
                  {neighborhood.avg_price && (
                    <span style={{ fontSize: '13px', color: '#27ae60', fontWeight: '600' }}>
                      From ${Number(neighborhood.avg_price).toLocaleString()}/mo
                    </span>
                  )}
                </div>
                <button className="secondary" style={{ width: '100%', marginTop: '10px' }}>
                  View Properties
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Neighborhoods;