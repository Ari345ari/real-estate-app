import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Bookings({ token, user }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const endpoint = user?.Role === 'Agent' 
        ? 'http://localhost:5000/api/bookings/agent-bookings'
        : 'http://localhost:5000/api/bookings/my-bookings';
      const res = await axios.get(endpoint, authHeader);
      setBookings(res.data);
    } catch (err) {
      setMessage('Failed to load bookings');
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this booking?')) {
      try {
        await axios.delete(`http://localhost:5000/api/bookings/${id}`, authHeader);
        setMessage('Booking cancelled');
        fetchBookings();
      } catch (err) {
        setMessage('Failed to cancel booking');
      }
    }
  };

  return (
    <div>
      <h2>{user?.Role === 'Agent' ? 'Agent' : 'My'} Bookings</h2>
      {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

      {bookings.length === 0 ? (
        <p>No bookings found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Total</th>
              {user?.Role === 'Agent' && <th>Renter</th>}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.Booking_ID}>
                <td>{booking.Description}</td>
                <td>{booking.Type}</td>
                <td>{new Date(booking.Rental_Start).toLocaleDateString()}</td>
                <td>{new Date(booking.Rental_End).toLocaleDateString()}</td>
                <td>${booking.Total.toFixed(2)}</td>
                {user?.Role === 'Agent' && <td>{booking.Name}</td>}
                <td>
                  <button 
                    className="danger" 
                    onClick={() => handleCancel(booking.Booking_ID)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Bookings;