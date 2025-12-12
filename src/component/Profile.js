import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Profile({ token, user }) {
  const [addresses, setAddresses] = useState([]);
  const [cards, setCards] = useState([]);
  const [message, setMessage] = useState('');
  const [addressForm, setAddressForm] = useState({ street: '', city: '', zip: '' });
  const [cardForm, setCardForm] = useState({ 
    card_number: '', 
    expiry_month: '', 
    expiry_year: '', 
    cvv: '', 
    billing_address_id: '' 
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const isAgent = user?.role === 'Agent' || user?.Role === 'Agent';

  useEffect(() => {
    fetchAddresses();
    if (!isAgent) {
      fetchCards();
    }
  }, [isAgent]);

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
        setMessage(err.response?.data?.error || 'Failed to delete address');
      }
    }
  };

  const addCard = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/card', cardForm, authHeader);
      setMessage('Card added');
      setCardForm({ card_number: '', expiry_month: '', expiry_year: '', cvv: '', billing_address_id: '' });
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
    <div className="container">
      <h2>Profile</h2>
      {message && <div className={`message ${message.includes('Failed') ? 'error' : 'success'}`}>{message}</div>}

      <div className="card">
        <h3>User Information</h3>
        <p><strong>Name:</strong> {user?.name || user?.Name}</p>
        <p><strong>Email:</strong> {user?.email || user?.Email}</p>
        <p><strong>Phone:</strong> {user?.phone || user?.Phone}</p>
        <p><strong>Role:</strong> {user?.role || user?.Role}</p>
      </div>

      <div className="card">
        <h3>Addresses</h3>
        {!showAddressForm ? (
          <button onClick={() => setShowAddressForm(true)}>Add Address</button>
        ) : (
          <form onSubmit={addAddress}>
            <div className="form-group">
              <label>Street</label>
              <input value={addressForm.street} onChange={(e) => setAddressForm({...addressForm, street: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>ZIP</label>
              <input value={addressForm.zip} onChange={(e) => setAddressForm({...addressForm, zip: e.target.value})} required />
            </div>
            <button type="submit">Save</button>
            <button type="button" className="secondary" onClick={() => setShowAddressForm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
          </form>
        )}
        <ul style={{ marginTop: '15px' }}>
          {addresses.map(addr => (
            <li key={addr.address_id}>
              {addr.street}, {addr.city}, {addr.zip}
              <button className="danger" onClick={() => deleteAddress(addr.address_id)} style={{ marginLeft: '10px', padding: '5px 10px' }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Only show cards section for renters */}
      {!isAgent && (
        <div className="card">
          <h3>Payment Cards</h3>
          {!showCardForm ? (
            <button onClick={() => setShowCardForm(true)} disabled={addresses.length === 0}>
              {addresses.length === 0 ? 'Add an address first' : 'Add Card'}
            </button>
          ) : (
            <form onSubmit={addCard}>
              <div className="form-group">
                <label>Card Number</label>
                <input 
                  value={cardForm.card_number} 
                  onChange={(e) => setCardForm({...cardForm, card_number: e.target.value})} 
                  maxLength="16" 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Month (MM)</label>
                  <input 
                    value={cardForm.expiry_month} 
                    onChange={(e) => setCardForm({...cardForm, expiry_month: e.target.value})} 
                    placeholder="MM"
                    maxLength="2"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Year (YY)</label>
                  <input 
                    value={cardForm.expiry_year} 
                    onChange={(e) => setCardForm({...cardForm, expiry_year: e.target.value})} 
                    placeholder="YY"
                    maxLength="2"
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input 
                    value={cardForm.cvv} 
                    onChange={(e) => setCardForm({...cardForm, cvv: e.target.value})} 
                    maxLength="3"
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Billing Address</label>
                <select value={cardForm.billing_address_id} onChange={(e) => setCardForm({...cardForm, billing_address_id: e.target.value})} required>
                  <option value="">Select Address</option>
                  {addresses.map(addr => (
                    <option key={addr.address_id} value={addr.address_id}>{addr.street}, {addr.city}</option>
                  ))}
                </select>
              </div>
              <button type="submit">Save</button>
              <button type="button" className="secondary" onClick={() => setShowCardForm(false)} style={{ marginLeft: '10px' }}>Cancel</button>
            </form>
          )}
          <ul style={{ marginTop: '15px' }}>
            {cards.map(card => (
              <li key={card.card_id}>
                •••• {card.card_number.slice(-4)} - Exp: {card.expiry_month}/{card.expiry_year}
                <button className="danger" onClick={() => deleteCard(card.card_id)} style={{ marginLeft: '10px', padding: '5px 10px' }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Profile;