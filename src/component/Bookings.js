import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Bookings({ token, user }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const isAgent = user?.Role === 'Agent' || user?.role === 'Agent';

  const defaultImages = {
    'Apartment': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'House': 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'Commercial': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'Vacation': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
    'Land': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const endpoint = isAgent 
        ? 'http://localhost:5000/api/bookings/agent-bookings'
        : 'http://localhost:5000/api/bookings/my-bookings';
      const res = await axios.get(endpoint, authHeader);
      setBookings(res.data);
    } catch (err) {
      setMessage('Failed to load bookings');
    }
  };

  const handleCancel = async (id) => {
    const booking = bookings.find(b => b.booking_id === id);
    const cardInfo = booking?.card_number ? `Card ending in ${booking.card_number.slice(-4)}` : 'original payment method';
    
    if (window.confirm(`Cancel this booking? Refund will be processed to ${cardInfo}.`)) {
      try {
        const res = await axios.delete(`http://localhost:5000/api/bookings/${id}`, authHeader);
        setMessage(res.data.message);
        fetchBookings();
        setTimeout(() => setMessage(''), 5000);
      } catch (err) {
        setMessage(err.response?.data?.error || 'Failed to cancel booking');
      }
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getPropertyImage = (booking) => {
    return booking.image_url || defaultImages[booking.type] || defaultImages['House'];
  };

  const getStatusStyle = (status) => {
    if (status === 'cancelled') {
      return { color: '#e74c3c', background: '#fdecea', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
    }
    return { color: '#27ae60', background: '#e8f5e9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' };
  };

  return (
    <div className="container">
      <h2>{isAgent ? 'Bookings for My Properties' : 'My Bookings'}</h2>
      {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

      {bookings.length === 0 ? (
        <div className="card">
          <p style={{ color: '#666' }}>No bookings found.</p>
        </div>
      ) : (
        <div>
          {bookings.map(booking => (
            <div key={booking.booking_id} className="card" style={{ marginBottom: '15px', opacity: booking.status === 'cancelled' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {/* Property Image */}
                <img 
                  src={getPropertyImage(booking)} 
                  alt={booking.type}
                  style={{ width: '150px', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
                />
                
                {/* Property Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0 }}>{booking.type}</h3>
                    <span style={getStatusStyle(booking.status || 'active')}>
                      {(booking.status || 'active').toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>{booking.description}</p>
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>{booking.city}, {booking.state}</p>
                  <p style={{ fontSize: '14px', color: '#888', margin: '4px 0' }}>
                    ${Number(booking.price || 0).toLocaleString()}/month
                  </p>
                </div>

                {/* Booking Details */}
                <div style={{ minWidth: '150px' }}>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}><strong>Rental Period</strong></p>
                  <p style={{ fontSize: '14px', margin: '4px 0' }}>
                    {formatDate(booking.rental_start)} - {formatDate(booking.rental_end)}
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60', margin: '8px 0' }}>
                    ${Number(booking.total || 0).toFixed(2)}
                  </p>
                </div>

                {/* Renter/Payment Info */}
                <div style={{ minWidth: '150px' }}>
                  {isAgent ? (
                    <>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}><strong>Renter</strong></p>
                      <p style={{ fontSize: '14px', margin: '4px 0' }}>{booking.renter_name || booking.name}</p>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>{booking.renter_email || booking.email}</p>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>{booking.renter_phone || booking.phone}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}><strong>Payment</strong></p>
                      <p style={{ fontSize: '14px', margin: '4px 0' }}>
                        {booking.card_number 
                          ? `•••• ${booking.card_number.slice(-4)}`
                          : 'No card'
                        }
                      </p>
                    </>
                  )}
                </div>

                {/* Cancel Button */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {booking.status !== 'cancelled' && (
                    <button className="danger" onClick={() => handleCancel(booking.booking_id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookings;