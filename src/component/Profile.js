import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profile({ token, user }) {
  const [addresses, setAddresses] = useState([]);
  const [cards, setCards] = useState([]);
  const [message, setMessage] = useState('');
  const [addressForm, setAddressForm] = useState({ street: '', city: '', zip: '' });
  const [cardForm, setCardForm] = useState({ card_number: '', expiry: '', billing_address_id: '' });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAddresses();
    fetchCards();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/addresses', authHeader);
      setAddresses(res.data);
    } catch (err) {
      setMessage('Failed to load addresses');
    }
  };

  const fetchCards = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/cards', authHeader);
      setCards(res.data);
    } catch (err) {
      setMessage('Failed to load cards');
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/address', addressForm, authHeader);
      setMessage('Address added');
      setAddressForm({ street: '', city: '', zip: '' });
      setShowAddressForm(false);
      fetchAddresses();
    } catch (err) {
      setMessage('Failed to add address');
    }
  };

  const deleteAddress = async (id) => {
    if (window.confirm('Delete this address?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/address/${id}`, authHeader);
        setMessage('Address deleted');
        fetchAddresses();
      } catch (err) {
        setMessage('Failed to delete address');
      }
    }
  };

  const addCard = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/card', cardForm, authHeader);
      setMessage('Card added');
      setCardForm({ card_number: '', expiry: '', billing_address_id: '' });
      setShowCardForm(false);
      fetchCards();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to add card');
    }
  };

  const deleteCard = async (id) => {
    if (window.confirm('Delete this card?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/card/${id}`, authHeader);
        setMessage('Card deleted');
        fetchCards();
      } catch (err) {
        setMessage('Failed to delete card');
      }
    }
  };

  return (
    <div>
      <h2>Profile</h2>
      {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

      <div className="card">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {user?.Name}</p>
        <p><strong>Email:</strong> {user?.Email}</p>
        <p><strong>Phone:</strong> {user?.Phone}</p>
        <p><strong>Role:</strong> {user?.Role}</p>
      </div>

      <div className="card">
        <h3>Addresses</h3>
        {!showAddressForm ? (
          <button onClick={() => setShowAddressForm(true)}>Add Address</button>
        ) : (
          <form onSubmit={addAddress}>
            <div className="form-group">
              <label>Street</label>
              <input value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>ZIP</label>
              <input value={addressForm.zip} onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })} required />
            </div>
            <button type="submit">Save Address</button>
            <button type="button" onClick={() => setShowAddressForm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
          </form>
        )}
        <ul style={{ marginTop: '15px' }}>
          {addresses.map(addr => (
            <li key={addr.Address_ID} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              {addr.Street}, {addr.City}, {addr.ZIP}
              <button onClick={() => deleteAddress(addr.Address_ID)} className="danger" style={{ marginLeft: '10px', padding: '5px 10px' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Payment Cards</h3>
        {!showCardForm ? (
          <button onClick={() => setShowCardForm(true)}>Add Card</button>
        ) : (
          <form onSubmit={addCard}>
            <div className="form-group">
              <label>Card Number</label>
              <input value={cardForm.card_number} onChange={(e) => setCardForm({ ...cardForm, card_number: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={cardForm.expiry} onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Billing Address</label>
              <select value={cardForm.billing_address_id} onChange={(e) => setCardForm({ ...cardForm, billing_address_id: e.target.value })} required>
                <option value="">Select Address</option>
                {addresses.map(addr => (
                  <option key={addr.Address_ID} value={addr.Address_ID}>{addr.Street}, {addr.City}</option>
                ))}
              </select>
            </div>
            <button type="submit">Save Card</button>
            <button type="button" onClick={() => setShowCardForm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
          </form>
        )}
        <ul style={{ marginTop: '15px' }}>
          {cards.map(card => (
            <li key={card.Card_ID} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
              Card ending in {card.Card_Number.slice(-4)} - Expires: {new Date(card.Expiry).toLocaleDateString()}
              <button onClick={() => deleteCard(card.Card_ID)} className="danger" style={{ marginLeft: '10px', padding: '5px 10px' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Profile;